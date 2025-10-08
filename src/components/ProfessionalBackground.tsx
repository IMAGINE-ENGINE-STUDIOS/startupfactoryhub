import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Briefcase, GraduationCap, Award, Plus, Edit, Save, X, MapPin, Calendar, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  current: boolean;
}
interface Education {
  id: string;
  degree: string;
  institution: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  description: string;
}
interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  organization: string;
}
export default function ProfessionalBackground() {
  const [profile, setProfile] = useState<any>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProfile, setEditingProfile] = useState<any>({});
  const {
    user
  } = useAuth();
  const {
    role
  } = useUserRole();
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchExperiences();
      fetchEducation();
      fetchAchievements();
    }
  }, [user]);
  const fetchProfile = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (!error && data) {
      setProfile(data);
      setEditingProfile(data);
    }
  };
  const fetchExperiences = async () => {
    // Mock data for experiences - in real app this would be from a dedicated table
    const mockExperiences: Experience[] = [{
      id: '1',
      title: 'Senior Product Manager',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      start_date: '2020-01',
      end_date: '',
      description: 'Led product strategy for B2B SaaS platform serving 50k+ users. Increased user engagement by 40% through data-driven feature development.',
      current: true
    }, {
      id: '2',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'New York, NY',
      start_date: '2018-06',
      end_date: '2019-12',
      description: 'Managed product roadmap for mobile application. Successfully launched 3 major features that increased retention by 25%.',
      current: false
    }];
    setExperiences(mockExperiences);
  };
  const fetchEducation = async () => {
    // Mock data for education
    const mockEducation: Education[] = [{
      id: '1',
      degree: 'MBA',
      institution: 'Stanford Graduate School of Business',
      field_of_study: 'Technology Management',
      start_date: '2016-09',
      end_date: '2018-06',
      description: 'Focused on technology entrepreneurship and product management. Graduated with honors.'
    }, {
      id: '2',
      degree: 'Bachelor of Science',
      institution: 'UC Berkeley',
      field_of_study: 'Computer Science',
      start_date: '2012-09',
      end_date: '2016-05',
      description: 'Concentrated in software engineering and human-computer interaction.'
    }];
    setEducation(mockEducation);
  };
  const fetchAchievements = async () => {
    // Mock data for achievements
    const mockAchievements: Achievement[] = [{
      id: '1',
      title: 'Top 40 Under 40 in Tech',
      description: 'Recognized for innovation in product management and startup mentorship.',
      date: '2023-03',
      organization: 'Tech Leadership Awards'
    }, {
      id: '2',
      title: 'Product Manager of the Year',
      description: 'Awarded for exceptional product strategy and team leadership.',
      date: '2022-11',
      organization: 'Product Management Institute'
    }];
    setAchievements(mockAchievements);
  };
  const updateProfile = async () => {
    if (!user) return;
    const {
      error
    } = await supabase.from('profiles').update({
      full_name: editingProfile.full_name,
      bio: editingProfile.bio,
      linkedin_url: editingProfile.linkedin_url,
      website: editingProfile.website,
      focus_areas: editingProfile.focus_areas,
      experience_level: editingProfile.experience_level,
      location: editingProfile.location
    }).eq('user_id', user.id);
    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return;
    }
    setProfile(editingProfile);
    setIsEditing(false);
    toast({
      title: "Success",
      description: "Profile updated successfully!"
    });
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };
  const getExperienceYears = () => {
    if (!experiences.length) return '0';
    const totalMonths = experiences.reduce((total, exp) => {
      const start = new Date(exp.start_date);
      const end = exp.current ? new Date() : new Date(exp.end_date);
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return total + months;
    }, 0);
    return Math.floor(totalMonths / 12).toString();
  };
  if (!profile) {
    return <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading profile...</p>
      </div>;
  }
  return;
}