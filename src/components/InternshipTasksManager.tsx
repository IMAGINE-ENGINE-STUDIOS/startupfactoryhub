import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CheckCircle, Clock, Plus, Users } from 'lucide-react';

interface InternshipTask {
  id: string;
  internship_id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  internships: {
    title: string;
  };
  student_tasks?: {
    student_id: string;
    completed: boolean;
    profiles: {
      full_name: string;
      avatar_url: string;
    };
  }[];
}

export default function InternshipTasksManager() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<InternshipTask[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInternshipId, setSelectedInternshipId] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchInternships();
      fetchTasks();
    }
  }, [user]);

  const fetchInternships = async () => {
    if (!user) return;

    const { data: companyData } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!companyData) return;

    const { data, error } = await supabase
      .from('internships')
      .select('id, title')
      .eq('company_id', companyData.id)
      .eq('status', 'active');

    if (!error && data) {
      setInternships(data);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!companyData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('internship_tasks')
        .select(`
          *,
          internships!inner(title, company_id),
          student_internship_tasks(
            student_id,
            completed,
            profiles:student_id(full_name, avatar_url)
          )
        `)
        .eq('internships.company_id', companyData.id)
        .order('due_date', { ascending: true });

      if (!error && data) {
        setTasks(data as any);
      }
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
      const { error } = await supabase.from('internship_tasks').insert({
        internship_id: selectedInternshipId,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        due_date: formData.get('due_date') as string,
      });

      if (error) throw error;

      toast.success('Task created successfully!');
      setIsCreateDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const getTaskProgress = (task: InternshipTask) => {
    if (!task.student_tasks || task.student_tasks.length === 0) return 0;
    const completed = task.student_tasks.filter(st => st.completed).length;
    return Math.round((completed / task.student_tasks.length) * 100);
  };

  if (loading) {
    return <div className="text-center p-8">Loading tasks...</div>;
  }

  if (internships.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Create an internship first to add tasks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Internship Tasks Management</h3>
          <p className="text-muted-foreground">Track student progress on internship tasks</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="tech-card border-0 !transition-none">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <Label htmlFor="internship">Internship *</Label>
                <Select 
                  name="internship" 
                  value={selectedInternshipId}
                  onValueChange={setSelectedInternshipId}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select internship" />
                  </SelectTrigger>
                  <SelectContent>
                    {internships.map((internship) => (
                      <SelectItem key={internship.id} value={internship.id}>
                        {internship.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div>
                <Label htmlFor="due_date">Due Date *</Label>
                <Input id="due_date" name="due_date" type="date" required />
              </div>
              <Button type="submit" className="w-full">Create Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card className="tech-card border-0">
            <CardContent className="p-8 text-center text-muted-foreground">
              No tasks created yet. Create your first task to get started.
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="tech-card border-0">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.internships.title}
                    </p>
                  </div>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.description && (
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                )}
                
                {task.student_tasks && task.student_tasks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Student Progress</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {task.student_tasks.filter(st => st.completed).length} / {task.student_tasks.length} completed
                      </span>
                    </div>
                    <Progress value={getTaskProgress(task)} className="h-2" />
                    
                    <div className="space-y-2">
                      {task.student_tasks.map((studentTask) => (
                        <div
                          key={studentTask.student_id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle 
                              className={`h-4 w-4 ${studentTask.completed ? 'text-green-500' : 'text-muted-foreground'}`}
                            />
                            <span className="text-sm">
                              {studentTask.profiles?.full_name || 'Unknown Student'}
                            </span>
                          </div>
                          <Badge variant={studentTask.completed ? 'default' : 'secondary'}>
                            {studentTask.completed ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
