import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Experience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  field_of_study: string | null;
  start_date: string;
  end_date: string | null;
  description: string | null;
}

interface Achievement {
  id: string;
  title: string;
  organization: string | null;
  date: string;
  description: string | null;
  icon: string | null;
}

interface Skill {
  id: string;
  skill_name: string;
  category: string | null;
  endorsement_count: number;
}

export const useAdvisorProfile = (userId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const targetUserId = userId || user?.id;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetUserId) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        const [expData, eduData, achData, skillData] = await Promise.all([
          supabase
            .from('advisor_experiences')
            .select('*')
            .eq('user_id', targetUserId)
            .order('start_date', { ascending: false }),
          supabase
            .from('advisor_education')
            .select('*')
            .eq('user_id', targetUserId)
            .order('start_date', { ascending: false }),
          supabase
            .from('advisor_achievements')
            .select('*')
            .eq('user_id', targetUserId)
            .order('date', { ascending: false }),
          supabase
            .from('advisor_skills')
            .select('*')
            .eq('user_id', targetUserId)
            .order('endorsement_count', { ascending: false }),
        ]);

        if (expData.data) setExperiences(expData.data);
        if (eduData.data) setEducation(eduData.data);
        if (achData.data) setAchievements(achData.data);
        if (skillData.data) setSkills(skillData.data);
      } catch (error) {
        console.error('Error fetching advisor profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [targetUserId]);

  const addExperience = async (experience: Omit<Experience, 'id'>) => {
    if (!user) return { success: false, error: 'No user' };

    if (!experience.title || !experience.company || !experience.start_date) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return { success: false };
    }

    const { data, error } = await supabase
      .from('advisor_experiences')
      .insert({ ...experience, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding experience:', error);
      toast({
        title: 'Error',
        description: 'Failed to add experience. Please try again.',
        variant: 'destructive'
      });
      return { success: false, error };
    }

    if (data) {
      setExperiences((prev) => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Experience added successfully'
      });
      return { success: true, data };
    }

    return { success: false };
  };

  const updateExperience = async (id: string, updates: Partial<Experience>) => {
    const { data, error } = await supabase
      .from('advisor_experiences')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (data && !error) {
      setExperiences((prev) => prev.map((exp) => (exp.id === id ? data : exp)));
    }
  };

  const deleteExperience = async (id: string) => {
    await supabase.from('advisor_experiences').delete().eq('id', id);
    setExperiences((prev) => prev.filter((exp) => exp.id !== id));
  };

  const addEducation = async (edu: Omit<Education, 'id'>) => {
    if (!user) return { success: false, error: 'No user' };

    if (!edu.degree || !edu.institution || !edu.start_date) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return { success: false };
    }

    const { data, error } = await supabase
      .from('advisor_education')
      .insert({ ...edu, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding education:', error);
      toast({
        title: 'Error',
        description: 'Failed to add education. Please try again.',
        variant: 'destructive'
      });
      return { success: false, error };
    }

    if (data) {
      setEducation((prev) => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Education added successfully'
      });
      return { success: true, data };
    }

    return { success: false };
  };

  const updateEducation = async (id: string, updates: Partial<Education>) => {
    const { data, error } = await supabase
      .from('advisor_education')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (data && !error) {
      setEducation((prev) => prev.map((e) => (e.id === id ? data : e)));
    }
  };

  const deleteEducation = async (id: string) => {
    await supabase.from('advisor_education').delete().eq('id', id);
    setEducation((prev) => prev.filter((e) => e.id !== id));
  };

  const addAchievement = async (achievement: Omit<Achievement, 'id'>) => {
    if (!user) return { success: false, error: 'No user' };

    if (!achievement.title || !achievement.date) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return { success: false };
    }

    const { data, error } = await supabase
      .from('advisor_achievements')
      .insert({ ...achievement, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding achievement:', error);
      toast({
        title: 'Error',
        description: 'Failed to add achievement. Please try again.',
        variant: 'destructive'
      });
      return { success: false, error };
    }

    if (data) {
      setAchievements((prev) => [data, ...prev]);
      toast({
        title: 'Success',
        description: 'Achievement added successfully'
      });
      return { success: true, data };
    }

    return { success: false };
  };

  const deleteAchievement = async (id: string) => {
    await supabase.from('advisor_achievements').delete().eq('id', id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  };

  const addSkill = async (skill: Omit<Skill, 'id' | 'endorsement_count'>) => {
    if (!user) return { success: false, error: 'No user' };

    if (!skill.skill_name) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a skill name',
        variant: 'destructive'
      });
      return { success: false };
    }

    const { data, error } = await supabase
      .from('advisor_skills')
      .insert({ ...skill, user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Error adding skill:', error);
      toast({
        title: 'Error',
        description: 'Failed to add skill. Please try again.',
        variant: 'destructive'
      });
      return { success: false, error };
    }

    if (data) {
      setSkills((prev) => [...prev, data]);
      toast({
        title: 'Success',
        description: 'Skill added successfully'
      });
      return { success: true, data };
    }

    return { success: false };
  };

  const deleteSkill = async (id: string) => {
    await supabase.from('advisor_skills').delete().eq('id', id);
    setSkills((prev) => prev.filter((s) => s.id !== id));
  };

  return {
    experiences,
    education,
    achievements,
    skills,
    loading,
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    addAchievement,
    deleteAchievement,
    addSkill,
    deleteSkill,
  };
};
