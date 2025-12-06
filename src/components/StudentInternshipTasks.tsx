import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CheckCircle, Clock, FileText } from 'lucide-react';

interface StudentTask {
  id: string;
  application_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
  time_spent_hours: number | null;
  notes: string | null;
  internship_tasks: {
    title: string;
    description: string;
    due_date: string;
    internships: {
      title: string;
      companies: {
        name: string;
      };
    };
  };
}

export default function StudentInternshipTasks() {
  const { user } = useAuth();
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
      const { data, error } = await supabase
        .from('student_internship_tasks')
        .select(`
          *,
          internship_tasks!inner(
            title,
            description,
            due_date,
            internships!inner(
              title,
              companies!inner(name)
            )
          )
        `)
        .eq('student_id', user.id)
        .order('completed', { ascending: true });

      if (!error && data) {
        setTasks(data as any);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('student_internship_tasks')
        .update({
          completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success(currentStatus ? 'Task marked as incomplete' : 'Task completed!');
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleUpdateNotes = async (taskId: string, notes: string, timeSpent: number) => {
    try {
      const { error } = await supabase
        .from('student_internship_tasks')
        .update({
          notes,
          time_spent_hours: timeSpent,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Notes saved successfully!');
      setExpandedTask(null);
      fetchTasks();
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const getTaskProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  if (loading) {
    return <div className="text-center p-8">Loading your tasks...</div>;
  }

  if (tasks.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-8 text-center text-muted-foreground">
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
          <p>Your internship tasks will appear here once assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>My Internship Tasks</span>
            <Badge variant="outline">
              {tasks.filter(t => t.completed).length} / {tasks.length} completed
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={getTaskProgress()} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className={`tech-card border-0 ${task.completed ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle 
                      className={`h-5 w-5 ${task.completed ? 'text-green-500' : 'text-muted-foreground'}`}
                    />
                    <CardTitle className="text-lg">
                      {task.internship_tasks.title}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {task.internship_tasks.internships.title} • {task.internship_tasks.internships.companies.name}
                  </p>
                </div>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Due {new Date(task.internship_tasks.due_date).toLocaleDateString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.internship_tasks.description && (
                <p className="text-sm text-muted-foreground">
                  {task.internship_tasks.description}
                </p>
              )}

              {expandedTask === task.id ? (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor={`notes-${task.id}`}>Notes</Label>
                    <Textarea
                      id={`notes-${task.id}`}
                      defaultValue={task.notes || ''}
                      placeholder="Add your notes here..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`time-${task.id}`}>Time Spent (hours)</Label>
                    <Input
                      id={`time-${task.id}`}
                      type="number"
                      step="0.5"
                      defaultValue={task.time_spent_hours || 0}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const notes = (document.getElementById(`notes-${task.id}`) as HTMLTextAreaElement).value;
                        const timeSpent = parseFloat((document.getElementById(`time-${task.id}`) as HTMLInputElement).value) || 0;
                        handleUpdateNotes(task.id, notes, timeSpent);
                      }}
                    >
                      Save Notes
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
                <>
                  {task.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium mb-1">My Notes:</p>
                      <p className="text-sm text-muted-foreground">{task.notes}</p>
                      {task.time_spent_hours && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Time spent: {task.time_spent_hours} hours
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={task.completed ? 'outline' : 'default'}
                      onClick={() => handleToggleComplete(task.id, task.completed)}
                    >
                      {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedTask(task.id)}
                    >
                      {task.notes ? 'Edit Notes' : 'Add Notes'}
                    </Button>
                  </div>
                </>
              )}

              {task.completed && task.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Completed on {new Date(task.completed_at).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
