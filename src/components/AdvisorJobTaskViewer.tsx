import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface JobTask {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  jobs: {
    title: string;
    category: string;
    companies: {
      name: string;
    };
  };
  advisor_job_tasks: Array<{
    id: string;
    completed: boolean;
    completed_at: string | null;
  }>;
}

export default function AdvisorJobTaskViewer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all accepted job applications for this user
      const { data: acceptedApplications } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (!acceptedApplications?.length) {
        setTasks([]);
        return;
      }

      const acceptedJobIds = acceptedApplications.map(app => app.job_id);

      // Get tasks for those jobs
      const { data, error } = await supabase
        .from('job_tasks')
        .select(`
          *,
          jobs!inner (
            title,
            category,
            companies!inner (
              name
            )
          ),
          advisor_job_tasks!left (
            id,
            completed,
            completed_at
          )
        `)
        .in('job_id', acceptedJobIds)
        .or(`advisor_id.eq.${user.id},advisor_id.is.null`, { foreignTable: 'advisor_job_tasks' })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const taskRecord = tasks
        .find(t => t.id === taskId)
        ?.advisor_job_tasks?.[0];

      if (taskRecord) {
        // Update existing record
        const { error } = await supabase
          .from('advisor_job_tasks')
          .update({
            completed: !currentStatus,
            completed_at: !currentStatus ? new Date().toISOString() : null,
          })
          .eq('id', taskRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('advisor_job_tasks')
          .insert({
            task_id: taskId,
            advisor_id: user.id,
            completed: true,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: !currentStatus ? 'Task Completed!' : 'Task Marked Incomplete',
        description: !currentStatus ? 'Great work!' : 'Task status updated',
      });

      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No tasks assigned yet.</p>
            <p className="text-sm mt-2">Tasks will appear here once your job applications are accepted.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <ListTodo className="h-6 w-6" />
            My Tasks
          </CardTitle>
          <CardDescription>
            Complete tasks for jobs you've been accepted to
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {tasks.map((task) => {
          const isCompleted = task.advisor_job_tasks?.[0]?.completed || false;
          const completedAt = task.advisor_job_tasks?.[0]?.completed_at;

          return (
            <Card key={task.id} className={isCompleted ? 'border-green-500/50' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleTaskCompletion(task.id, isCompleted)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className={`text-lg ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </CardTitle>
                      <CardDescription>
                        {task.jobs.title} • {task.jobs.companies.name}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={isCompleted ? 'default' : 'secondary'}>
                    {isCompleted ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" /> Complete</>
                    ) : (
                      'Pending'
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  {completedAt && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed: {new Date(completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
