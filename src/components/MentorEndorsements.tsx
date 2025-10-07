import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ThumbsUp, Award, Star, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Endorsement {
  id: string;
  mentor_id: string;
  endorser_id: string;
  skill: string;
  comment: string | null;
  created_at: string;
  endorser_profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface EndorsementsBySkill {
  skill: string;
  count: number;
  endorsements: Endorsement[];
}

interface MentorEndorsementsProps {
  mentorId: string;
  isOwnProfile?: boolean;
}

export default function MentorEndorsements({ mentorId, isOwnProfile = false }: MentorEndorsementsProps) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [groupedEndorsements, setGroupedEndorsements] = useState<EndorsementsBySkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    skill: '',
    comment: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (mentorId) {
      fetchEndorsements();
    }
  }, [mentorId]);

  useEffect(() => {
    if (endorsements.length > 0) {
      groupEndorsementsBySkill();
    }
  }, [endorsements]);

  const fetchEndorsements = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('endorsements')
      .select(`
        *,
        endorser_profile:endorser_id (
          full_name,
          avatar_url
        )
      `)
      .eq('mentor_id', mentorId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setEndorsements(data.map(e => ({
        ...e,
        endorser_profile: Array.isArray(e.endorser_profile) ? e.endorser_profile[0] : e.endorser_profile
      })));
    }

    setLoading(false);
  };

  const groupEndorsementsBySkill = () => {
    const grouped: { [key: string]: Endorsement[] } = {};

    endorsements.forEach(endorsement => {
      if (!grouped[endorsement.skill]) {
        grouped[endorsement.skill] = [];
      }
      grouped[endorsement.skill].push(endorsement);
    });

    const groupedArray: EndorsementsBySkill[] = Object.entries(grouped).map(([skill, endorsements]) => ({
      skill,
      count: endorsements.length,
      endorsements
    }));

    // Sort by count descending
    groupedArray.sort((a, b) => b.count - a.count);
    setGroupedEndorsements(groupedArray);
  };

  const addEndorsement = async () => {
    if (!user || !formData.skill.trim()) {
      toast({
        title: "Error",
        description: "Please enter a skill to endorse",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('endorsements')
      .insert([{
        mentor_id: mentorId,
        endorser_id: user.id,
        skill: formData.skill.trim(),
        comment: formData.comment.trim() || null
      }]);

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Endorsed",
          description: "You've already endorsed this skill",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add endorsement",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Success",
      description: "Endorsement added!",
    });

    setDialogOpen(false);
    setFormData({ skill: '', comment: '' });
    fetchEndorsements();
  };

  const removeEndorsement = async (endorsementId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('endorsements')
      .delete()
      .eq('id', endorsementId)
      .eq('endorser_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove endorsement",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Endorsement removed",
    });

    fetchEndorsements();
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
            <Award className="h-6 w-6 text-primary" />
            <span>Skills & Endorsements</span>
          </div>
          {!isOwnProfile && user && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Endorse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Endorse Skills</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="skill">Skill</Label>
                    <Input
                      id="skill"
                      value={formData.skill}
                      onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                      placeholder="e.g., Product Strategy, Team Leadership"
                    />
                  </div>
                  <div>
                    <Label htmlFor="comment">Comment (Optional)</Label>
                    <Textarea
                      id="comment"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Share why you're endorsing this skill..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={addEndorsement} className="w-full">
                    Add Endorsement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groupedEndorsements.length > 0 ? (
          <>
            {/* Top Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {groupedEndorsements.map((group) => (
                <Badge
                  key={group.skill}
                  variant="secondary"
                  className="text-sm px-3 py-1 flex items-center space-x-2"
                >
                  <span>{group.skill}</span>
                  <span className="flex items-center space-x-1 text-primary">
                    <ThumbsUp className="h-3 w-3" />
                    <span className="font-bold">{group.count}</span>
                  </span>
                </Badge>
              ))}
            </div>

            {/* Recent Endorsements */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Recent Endorsements</h4>
              {endorsements.slice(0, 5).map((endorsement) => (
                <div
                  key={endorsement.id}
                  className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={endorsement.endorser_profile?.avatar_url} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {endorsement.endorser_profile?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-sm">
                            {endorsement.endorser_profile?.full_name || 'Anonymous'}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {endorsement.skill}
                          </Badge>
                        </div>
                        {endorsement.comment && (
                          <p className="text-xs text-muted-foreground">{endorsement.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(endorsement.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {user && endorsement.endorser_id === user.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEndorsement(endorsement.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No endorsements yet</p>
            {!isOwnProfile && (
              <p className="text-sm">Be the first to endorse this mentor!</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
