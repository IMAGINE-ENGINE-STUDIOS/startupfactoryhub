import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, Briefcase, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StudentTask {
  id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
  time_spent_hours: number | null;
  notes: string | null;
  job_tasks: {
    title: string;
    description: string | null;
    due_date: string | null;
  };
  job_applications: {
    jobs: {
      id: string;
      title: string;
      category: string;
      companies: {
        name: string;
        logo_url: string | null;
      };
    };
  };
}

export default function StudentJobTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('student_job_tasks')
        .select(`
          *,
          job_tasks (
            title,
            description,
            due_date
          ),
          job_applications!inner (
            jobs!inner (
              id,
              title,
              category,
              companies (
                name,
                logo_url
              )
            )
          )
        `)
        .eq('student_id', user.id)
        .order('completed', { ascending: true })
        .order('job_tasks.due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('student_job_tasks')
        .update({
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: !currentStatus ? 'Task marked as complete' : 'Task marked as incomplete',
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

  const handleUpdateNotes = async (taskId: string, notes: string, timeSpent: number | null) => {
    try {
      const { error } = await supabase
        .from('student_job_tasks')
        .update({
          notes,
          time_spent_hours: timeSpent,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Notes saved',
      });

      setExpandedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  // Group tasks by job
  const tasksByJob = tasks.reduce((acc, task) => {
    const jobId = task.job_applications.jobs.id;
    if (!acc[jobId]) {
      acc[jobId] = {
        job: task.job_applications.jobs,
        tasks: [],
      };
    }
    acc[jobId].tasks.push(task);
    return acc;
  }, {} as Record<string, { job: any; tasks: StudentTask[] }>);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">My Job Tasks</CardTitle>
          <CardDescription>Track and complete tasks for your active positions</CardDescription>
        </CardHeader>
      </Card>

      {totalTasks === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No tasks yet. Tasks will appear here once you're accepted to a task-based position.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Progress</span>
                <span className="font-medium">{completedTasks} / {totalTasks} tasks completed</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </CardContent>
          </Card>

          {/* Tasks by Job */}
          {Object.entries(tasksByJob).map(([jobId, { job, tasks: jobTasks }]) => {
            const jobProgress = Math.round(
              (jobTasks.filter(t => t.completed).length / jobTasks.length) * 100
            );

            return (
              <Card key={jobId}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {job.companies.logo_url && (
                      <img 
                        src={job.companies.logo_url} 
                        alt={job.companies.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{job.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {job.companies.name}
                          </CardDescription>
                        </div>
                        <Badge>{job.category}</Badge>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {jobTasks.filter(t => t.completed).length} / {jobTasks.length} tasks
                          </span>
                        </div>
                        <Progress value={jobProgress} />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobTasks.map((task) => (
                    <Card key={task.id} className={task.completed ? 'bg-muted/50' : ''}>
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {task.job_tasks.title}
                                </h4>
                                {task.job_tasks.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {task.job_tasks.description}
                                  </p>
                                )}
                              </div>
                              {task.completed && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {task.job_tasks.due_date && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Due: {new Date(task.job_tasks.due_date).toLocaleDateString()}
                                </div>
                              )}
                              {task.time_spent_hours && (
                                <span>{task.time_spent_hours}h spent</span>
                              )}
                            </div>

                            {task.completed && task.completed_at && (
                              <p className="text-xs text-green-600 mt-2">
                                Completed on {new Date(task.completed_at).toLocaleDateString()}
                              </p>
                            )}

                            {/* Notes Section */}
                            {expandedTask === task.id ? (
                              <div className="mt-4 space-y-3">
                                <div className="space-y-2">
                                  <Label>Time Spent (hours)</Label>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    defaultValue={task.time_spent_hours || ''}
                                    id={`time-${task.id}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Notes</Label>
                                  <Textarea
                                    defaultValue={task.notes || ''}
                                    rows={3}
                                    id={`notes-${task.id}`}
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      const timeInput = document.getElementById(`time-${task.id}`) as HTMLInputElement;
                                      const notesInput = document.getElementById(`notes-${task.id}`) as HTMLTextAreaElement;
                                      handleUpdateNotes(
                                        task.id,
                                        notesInput.value,
                                        timeInput.value ? Number(timeInput.value) : null
                                      );
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setExpandedTask(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => setExpandedTask(task.id)}
                              >
                                {task.notes ? 'Edit Notes' : 'Add Notes'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
