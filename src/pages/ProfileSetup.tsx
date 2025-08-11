import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { Building, MapPin, Users, DollarSign, Target, Plus, X } from "lucide-react";

const ProfileSetup = () => {
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
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

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-6">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">Help us personalize your startup journey</p>
          <Progress value={(step / 3) * 100} className="mt-4 max-w-md mx-auto" />
        </div>

        <Card className="glass-morphism border-ocean-border">
          <CardHeader>
            <CardTitle className="text-xl">
              Step {step} of 3: {step === 1 ? "Company Details" : step === 2 ? "Startup Stage" : "Goals & Skills"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <Label htmlFor="companyDescription">Company Description</Label>
                  <Textarea 
                    id="companyDescription" 
                    placeholder="Describe what your startup does..."
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fintech">FinTech</SelectItem>
                        <SelectItem value="healthtech">HealthTech</SelectItem>
                        <SelectItem value="edtech">EdTech</SelectItem>
                        <SelectItem value="ai">AI/ML</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="blockchain">Blockchain</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="location" placeholder="City, Country" className="pl-10" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website/Demo URL</Label>
                  <Input id="website" placeholder="https://yourcompany.com" className="mt-2" />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <Label>Startup Stage</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your current stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">Idea Stage</SelectItem>
                      <SelectItem value="prototype">Prototype/MVP</SelectItem>
                      <SelectItem value="validation">Product-Market Fit</SelectItem>
                      <SelectItem value="growth">Growth Stage</SelectItem>
                      <SelectItem value="scale">Scale Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="teamSize">Team Size</Label>
                    <div className="relative mt-2">
                      <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Just me</SelectItem>
                          <SelectItem value="2-5">2-5 people</SelectItem>
                          <SelectItem value="6-10">6-10 people</SelectItem>
                          <SelectItem value="11-25">11-25 people</SelectItem>
                          <SelectItem value="25+">25+ people</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="funding">Funding Status</Label>
                    <div className="relative mt-2">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Select>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bootstrap">Bootstrapped</SelectItem>
                          <SelectItem value="pre-seed">Pre-seed</SelectItem>
                          <SelectItem value="seed">Seed</SelectItem>
                          <SelectItem value="series-a">Series A</SelectItem>
                          <SelectItem value="series-b+">Series B+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="trl">Technology Readiness Level (TRL)</Label>
                  <Select>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select TRL level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">TRL 1-3: Basic Research</SelectItem>
                      <SelectItem value="4-6">TRL 4-6: Technology Development</SelectItem>
                      <SelectItem value="7-9">TRL 7-9: System Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <Label>Primary Goals (Select all that apply)</Label>
                  <div className="mt-2 space-y-2">
                    {[
                      "Find mentors and advisors",
                      "Connect with investors",
                      "Recruit team members",
                      "Access resources and tools",
                      "Join accelerator programs",
                      "Network with other founders",
                      "Get customer feedback",
                      "Learn and develop skills"
                    ].map((goal) => (
                      <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-ocean-border" />
                        <span className="text-sm">{goal}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="skills">Skills & Expertise</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Add a skill..."
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button onClick={addSkill} variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => removeSkill(skill)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="lookingFor">What are you looking for most?</Label>
                  <Textarea 
                    id="lookingFor" 
                    placeholder="Describe what you need help with right now..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-between pt-6">
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>
              <Button 
                variant="hero" 
                onClick={handleNext}
              >
                {step === 3 ? "Complete Profile" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSetup;