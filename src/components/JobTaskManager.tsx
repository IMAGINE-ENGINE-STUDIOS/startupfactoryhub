import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, CheckCircle2, Clock, Users, Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Job {
  id: string;
  title: string;
  category: string;
  is_task_based: boolean;
}

interface JobTask {
  id: string;
  job_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  jobs: {
    title: string;
    category: string;
  };
  student_job_tasks: Array<{
    id: string;
    completed: boolean;
    student_id: string;
  }>;
}

export default function JobTaskManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tasks, setTasks] = useState<JobTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      fetchCompanyId();
    }
  }, [user]);

  useEffect(() => {
    if (companyId) {
      fetchJobs();
      fetchTasks();
    }
  }, [companyId]);

  // Real-time subscription for student task completions
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('job-task-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_job_tasks'
        },
        (payload) => {
          console.log('Student task update:', payload);
          setLastUpdate(new Date());
          fetchTasks(); // Refresh tasks when student updates their progress
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_tasks'
        },
        (payload) => {
          console.log('Job task update:', payload);
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const fetchCompanyId = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setCompanyId(data.id);
    }
  };

  const fetchJobs = async () => {
    if (!companyId) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, category, is_task_based')
        .eq('company_id', companyId)
        .eq('is_task_based', true)
        .eq('status', 'active');

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchTasks = async () => {
    if (!companyId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('job_tasks')
        .select(`
          *,
          jobs!inner (
            title,
            category,
            company_id
          ),
          student_job_tasks (
            id,
            completed,
            student_id
          )
        `)
        .eq('jobs.company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const { error } = await supabase
        .from('job_tasks')
        .insert({
          job_id: formData.get('job_id') as string,
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          due_date: formData.get('due_date') as string || null,
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Task created and assigned to accepted applicants',
      });

      setShowCreateDialog(false);
      fetchTasks();
      e.currentTarget.reset();
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const getTaskProgress = (task: JobTask) => {
    const total = task.student_job_tasks.length;
    if (total === 0) return 0;
    const completed = task.student_job_tasks.filter(st => st.completed).length;
    return Math.round((completed / total) * 100);
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;

    try {
      // First delete student_job_tasks related to this task
      const { error: studentTasksError } = await supabase
        .from('student_job_tasks')
        .delete()
        .eq('task_id', deleteTaskId);

      if (studentTasksError) throw studentTasksError;

      // Then delete the task itself
      const { error } = await supabase
        .from('job_tasks')
        .delete()
        .eq('id', deleteTaskId);

      if (error) throw error;

      toast({
        title: 'Task deleted',
        description: 'The task has been removed successfully',
      });

      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setDeleteTaskId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Task Management</CardTitle>
              <CardDescription>Create and manage tasks for your task-based positions</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button disabled={jobs.length === 0}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
              </DialogTrigger>
              <DialogContent className="tech-card border-0 !transition-none">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                  <DialogDescription>
                    This task will be automatically assigned to all accepted applicants
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="job_id">Select Job *</Label>
                    <Select name="job_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a job" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.map((job) => (
                          <SelectItem key={job.id} value={job.id}>
                            {job.title} ({job.category})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input id="title" name="title" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input id="due_date" name="due_date" type="date" />
                  </div>

                  <Button type="submit" className="w-full">Create Task</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {jobs.length === 0 && (
        <Card className="tech-card border-0">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No task-based positions available. Create a job with task management enabled first.
            </p>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && jobs.length > 0 && (
        <Card className="tech-card border-0">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No tasks yet. Click "Create Task" to get started.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {tasks.map((task) => {
          const progress = getTaskProgress(task);
          const totalAssignees = task.student_job_tasks.length;
          const completedCount = task.student_job_tasks.filter(st => st.completed).length;

          return (
            <Card key={task.id} className="tech-card border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>
                      {task.jobs.title} • {task.jobs.category}
                    </CardDescription>
                  </div>
                  <Badge variant={progress === 100 ? 'default' : 'secondary'}>
                    {progress}% Complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {completedCount} / {totalAssignees} students completed
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {task.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {totalAssignees} assignees
                    </div>
                    {progress === 100 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        All Complete
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTaskId(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Task Confirmation Dialog */}
      <AlertDialog open={deleteTaskId !== null} onOpenChange={(open) => !open && setDeleteTaskId(null)}>
        <AlertDialogContent className="tech-card border-0 !transition-none">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This will also remove all student assignments for this task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
