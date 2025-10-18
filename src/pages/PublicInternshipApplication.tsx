import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { GraduationCap, MapPin, Building, Upload, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface Internship {
  id: string;
  title: string;
  description: string;
  location?: string;
  duration?: string;
  compensation?: string;
  companies: {
    name: string;
    logo_url?: string;
  };
}

export default function PublicInternshipApplication() {
  const { internshipId } = useParams();
  const navigate = useNavigate();
  const [internship, setInternship] = useState<Internship | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    fetchInternship();
  }, [internshipId]);

  const fetchInternship = async () => {
    if (!internshipId) return;

    const { data, error } = await supabase
      .from('internships')
      .select('*, companies:company_id(name, logo_url)')
      .eq('id', internshipId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      toast.error('Internship not found');
      navigate('/');
      return;
    }

    setInternship(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!internship || !internshipId) return;

    let resumeUrl = '';

    // Upload resume if provided
    if (resumeFile) {
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public-resumes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, resumeFile);

      if (uploadError) {
        toast.error('Failed to upload resume');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      resumeUrl = publicUrl;
    }

    // Submit application
    const { error } = await supabase
      .from('public_internship_applications')
      .insert({
        internship_id: internshipId,
        applicant_name: formData.name,
        applicant_email: formData.email,
        applicant_phone: formData.phone || null,
        cover_letter: formData.coverLetter || null,
        resume_url: resumeUrl || null,
      });

    if (error) {
      toast.error('Failed to submit application');
      return;
    }

    setSubmitted(true);
    toast.success('Application submitted successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!internship) return null;

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying to {internship.companies.name}. We'll review your application and get back to you soon.
            </p>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Internship Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start gap-4">
              {internship.companies.logo_url && (
                <img
                  src={internship.companies.logo_url}
                  alt={internship.companies.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">
                  <GraduationCap className="h-3 w-3 mr-1" />
                  Internship
                </Badge>
                <CardTitle className="text-2xl mb-2">{internship.title}</CardTitle>
                <CardDescription className="flex items-center gap-3 text-base">
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {internship.companies.name}
                  </span>
                  {internship.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {internship.location}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{internship.description}</p>
            <div className="flex flex-wrap gap-2">
              {internship.duration && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {internship.duration}
                </Badge>
              )}
              {internship.compensation && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {internship.compensation}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle>Apply for this Internship</CardTitle>
            <CardDescription>Fill out the form below to submit your application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resume">Resume (PDF, DOC, DOCX)</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                />
                {resumeFile && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    {resumeFile.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea
                  id="coverLetter"
                  rows={6}
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  placeholder="Tell us why you're interested in this internship..."
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Submit Application
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
