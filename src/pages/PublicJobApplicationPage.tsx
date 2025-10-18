import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, DollarSign, Clock, Building2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  category: string;
  duration: string | null;
  compensation_type: string;
  hourly_rate: number | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  benefits: string[] | null;
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
    description: string | null;
  } | null;
}

export default function PublicJobApplicationPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          companies (
            id,
            name,
            logo_url,
            description
          )
        `)
        .eq('id', jobId)
        .eq('status', 'active')
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast({
        title: 'Error',
        description: 'Job not found',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!jobId || submitting) return;

    if (!resumeFile) {
      toast({
        title: 'Resume Required',
        description: 'Please upload your resume/CV to continue.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      // Upload resume to storage
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${jobId}/${fileName}`.replace(/\/+/g, '/');

      const { error: uploadError } = await supabase.storage
        .from('public-resumes')
        .upload(filePath, resumeFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-resumes')
        .getPublicUrl(filePath);

      // Submit application with resume URL
      const { error } = await supabase
        .from('public_job_applications')
        .insert({
          job_id: jobId,
          applicant_name: formData.get('name') as string,
          applicant_email: formData.get('email') as string,
          applicant_phone: formData.get('phone') as string || null,
          cover_letter: formData.get('cover_letter') as string || null,
          resume_url: publicUrl,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Success!',
        description: 'Your application has been submitted',
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCompensationDisplay = () => {
    if (!job) return '';
    if (job.compensation_type === 'salary' && job.salary_range_min && job.salary_range_max) {
      return `$${job.salary_range_min.toLocaleString()} - $${job.salary_range_max.toLocaleString()}/year`;
    }
    if (job.compensation_type === 'hourly' && job.hourly_rate) {
      return `$${job.hourly_rate}/hour`;
    }
    return 'Compensation not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Job not found</p>
            <Button className="w-full mt-4" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground">
                Thank you for applying to {job.title} at {job.companies?.name}. 
                The company will review your application and get back to you soon.
              </p>
            </div>
            <Button className="w-full" onClick={() => navigate('/')}>
              Browse More Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Job Details */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start gap-4">
              {job.companies?.logo_url && (
                <img
                  src={job.companies.logo_url}
                  alt={job.companies.name}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <CardTitle className="text-2xl">{job.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 text-base mt-1">
                      <Building2 className="w-4 h-4" />
                      {job.companies?.name}
                    </CardDescription>
                  </div>
                  <Badge className="text-sm">{job.category}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {job.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </div>
              )}
              {job.duration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {job.duration}
                </div>
              )}
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {getCompensationDisplay()}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">About the Role</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {job.responsibilities.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.requirements && job.requirements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {job.requirements.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Benefits</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {job.benefits.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {job.companies?.description && (
              <div>
                <h3 className="font-semibold mb-2">About {job.companies.name}</h3>
                <p className="text-muted-foreground">{job.companies.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Position</CardTitle>
            <CardDescription>Fill out the form below to submit your application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume/CV *</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        toast({
                          title: 'File Too Large',
                          description: 'Please upload a file smaller than 5MB.',
                          variant: 'destructive',
                        });
                        e.target.value = '';
                        return;
                      }
                      setResumeFile(file);
                    }
                  }}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_letter">Cover Letter</Label>
                <Textarea
                  id="cover_letter"
                  name="cover_letter"
                  rows={6}
                  placeholder="Tell us why you're a great fit for this role..."
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
