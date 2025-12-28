import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Home, Users, Lightbulb, Heart, MapPin, Globe, Plus, X } from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";
import { ThemeToggle } from "@/components/ThemeToggle";
import mentorBadge from "@/assets/mentor-badge.png";

const INDUSTRIES = [
  { value: "aerospace", label: "Aerospace" },
  { value: "ai", label: "AI/ML" },
  { value: "biotech", label: "Biotech" },
  { value: "blockchain", label: "Blockchain" },
  { value: "cleantech", label: "CleanTech" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "defense", label: "Defense" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "edtech", label: "EdTech" },
  { value: "fintech", label: "FinTech" },
  { value: "hardware", label: "Hardware" },
  { value: "healthtech", label: "HealthTech" },
  { value: "quantum", label: "Quantum Computing" },
  { value: "robotics", label: "Robotics" },
  { value: "saas", label: "SaaS" },
  { value: "semiconductor", label: "Semiconductors" },
  { value: "software", label: "Software" },
  { value: "space", label: "Space Tech" },
  { value: "telecommunications", label: "Telecommunications" },
  { value: "other", label: "Other" },
];

const MENTOR_GOALS = [
  { id: "guide_startups", label: "Guide Startups", icon: Lightbulb },
  { id: "share_expertise", label: "Share Expertise", icon: Users },
  { id: "give_back", label: "Give Back", icon: Heart },
];

export default function JoinAsMentor() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const toggleGoal = (goalId: string) => {
    setGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    setLoading(true);

    const { error } = await signUp(email, password, fullName, "mentor");

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // Get the newly created user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Update the profile with additional data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          bio,
          location,
          website,
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }
    }

      toast.success("Welcome to the Mentor Program! Your account has been created successfully.");
      navigate("/mentor-dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <MatrixBackground />
      
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="hover-glow"
        >
          <Home className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Card */}
          <div className="tech-card p-8 rounded-2xl border border-primary/20 backdrop-blur-xl bg-background/80">
            {/* Mentor Badge Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={mentorBadge} 
                  alt="Mentor Badge" 
                  className="h-24 w-24 object-contain rounded-full border-4 border-emerald-500/30 neon-glow"
                />
                <div className="absolute -inset-2 bg-emerald-500/20 rounded-full blur-xl -z-10" />
              </div>
            </div>

            {/* Role Badge */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">Mentor</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Join as a Mentor
            </h1>

            {/* Welcome Message */}
            <p className="text-center text-muted-foreground mb-6 text-sm">
              Share your experience and guide the next generation of entrepreneurs. 
              Make a lasting impact on startup success stories.
            </p>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Basic Info */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself, your experience, and what you can offer as a mentor..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors resize-none"
                />
              </div>

              {/* Location & Website */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      type="text"
                      placeholder="City, Country"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="text-foreground">LinkedIn/Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://..."
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="pl-10 bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-foreground">Industry/Expertise</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="bg-background/50 border-primary/20 focus:border-emerald-400">
                    <SelectValue placeholder="Select your area of expertise" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <Label className="text-foreground">Skills</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill (e.g., Product Strategy)"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="bg-background/50 border-primary/20 focus:border-emerald-400 transition-colors"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={addSkill}
                    className="border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-pointer hover:bg-emerald-500/20"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <Label className="text-foreground">Goals as a Mentor</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MENTOR_GOALS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleGoal(id)}
                      className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center text-center ${
                        goals.includes(id)
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-primary/20 hover:border-emerald-500/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-1 ${goals.includes(id) ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                      <span className={`text-xs ${goals.includes(id) ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold py-6 rounded-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Join as Mentor
                  </div>
                )}
              </Button>
            </form>

            {/* Already have account */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/auth")}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
