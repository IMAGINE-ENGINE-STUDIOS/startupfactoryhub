import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, UserPlus, UserMinus, Lock, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  created_by: string;
  max_members: number;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export default function StudyGroups() {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    max_members: 10,
    is_public: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;
    setLoading(true);

    const { data: groupsData, error: groupsError } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupsError) {
      console.error('Error fetching groups:', groupsError);
      setLoading(false);
      return;
    }

    // Fetch member counts and check if user is a member
    const groupsWithDetails = await Promise.all(
      (groupsData || []).map(async (group) => {
        const { count } = await supabase
          .from('study_group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        const { data: membershipData } = await supabase
          .from('study_group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .single();

        return {
          ...group,
          member_count: count || 0,
          is_member: !!membershipData
        };
      })
    );

    setGroups(groupsWithDetails);
    setLoading(false);
  };

  const createGroup = async () => {
    if (!user) return;

    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('study_groups')
      .insert([{
        name: formData.name,
        description: formData.description,
        category: formData.category,
        created_by: user.id,
        max_members: formData.max_members,
        is_public: formData.is_public
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
      return;
    }

    // Auto-join the creator
    const { data: newGroup } = await supabase
      .from('study_groups')
      .select('id')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (newGroup) {
      await supabase
        .from('study_group_members')
        .insert([{
          group_id: newGroup.id,
          user_id: user.id,
          role: 'admin'
        }]);
    }

    toast({
      title: "Success",
      description: "Study group created!",
    });

    setDialogOpen(false);
    setFormData({
      name: '',
      description: '',
      category: 'general',
      max_members: 10,
      is_public: true
    });
    fetchGroups();
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('study_group_members')
      .insert([{
        group_id: groupId,
        user_id: user.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to join group",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "You've joined the study group!",
    });

    fetchGroups();
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "You've left the study group",
    });

    fetchGroups();
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Study Groups</span>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Web Development Bootcamp"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Let's learn together..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="max_members">Max Members</Label>
                  <Input
                    id="max_members"
                    type="number"
                    value={formData.max_members}
                    onChange={(e) => setFormData({ ...formData, max_members: parseInt(e.target.value) })}
                    min={2}
                    max={50}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_public">Public group (anyone can join)</Label>
                </div>
                <Button onClick={createGroup} className="w-full">Create Group</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-foreground">{group.name}</h3>
                  {group.is_public ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="text-xs">{group.category}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {group.member_count}/{group.max_members}
                  </span>
                </div>
              </div>
              <div>
                {group.is_member ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => leaveGroup(group.id)}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Leave
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => joinGroup(group.id)}
                    disabled={(group.member_count || 0) >= group.max_members}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No study groups yet</p>
            <p className="text-sm">Create the first one!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
