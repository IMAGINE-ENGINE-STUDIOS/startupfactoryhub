import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Workflow, CheckCircle, Lightbulb } from "lucide-react";

export default function TaskAutomation() {
  const { toast } = useToast();
  const [automationType, setAutomationType] = useState<string>("");
  const [automationName, setAutomationName] = useState("");
  const [automationDetails, setAutomationDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const automationTypes = [
    { value: "schedule_messages", label: "Schedule Messages", description: "Automate message scheduling based on triggers" },
    { value: "auto_respond", label: "Auto-Response", description: "Generate smart auto-responses to messages" },
    { value: "workflow", label: "Workflow Automation", description: "Design multi-step workflow automations" },
    { value: "task_suggestions", label: "Task Suggestions", description: "Get AI-powered task automation suggestions" },
  ];

  const createAutomation = async () => {
    if (!automationType || !automationName.trim()) {
      toast({
        title: "Error",
        description: "Please select automation type and provide a name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const config: any = {
        name: automationName,
        details: automationDetails,
      };

      // Add type-specific config
      if (automationType === "auto_respond") {
        config.messageContent = automationDetails || "Sample message to respond to";
      } else if (automationType === "task_suggestions") {
        config.userProfile = { goals: automationDetails || "General productivity" };
      }

      const { data, error } = await supabase.functions.invoke('ai-task-automation', {
        body: {
          automationType,
          config,
        }
      });

      if (error) {
        // Handle specific error codes
        if (error.message?.includes('429')) {
          throw new Error('Rate limit exceeded. Please try again in a moment.');
        }
        if (error.message?.includes('402')) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        throw error;
      }

      setResult(data);

      toast({
        title: "Automation Created",
        description: "Your task automation has been successfully created",
      });
    } catch (error: any) {
      console.error('Error creating automation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create automation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAutomationType("");
    setAutomationName("");
    setAutomationDetails("");
    setResult(null);
  };

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-primary" />
          Task Automation
        </CardTitle>
        <CardDescription>
          Automate workflows and repetitive tasks with AI-powered suggestions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="automation-type">Automation Type</Label>
              <Select value={automationType} onValueChange={setAutomationType}>
                <SelectTrigger id="automation-type">
                  <SelectValue placeholder="Select automation type" />
                </SelectTrigger>
                <SelectContent>
                  {automationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {automationType && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="automation-name">Automation Name</Label>
                  <Input
                    id="automation-name"
                    placeholder="Give your automation a name..."
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="automation-details">Details/Context</Label>
                  <Textarea
                    id="automation-details"
                    placeholder={
                      automationType === "schedule_messages"
                        ? "Describe when and what messages to send..."
                        : automationType === "auto_respond"
                          ? "Describe the type of messages to auto-respond to..."
                          : automationType === "workflow"
                            ? "Describe the workflow steps you want to automate..."
                            : "Describe your goals and what you want to automate..."
                    }
                    value={automationDetails}
                    onChange={(e) => setAutomationDetails(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <Button
                  onClick={createAutomation}
                  disabled={isLoading || !automationName.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Automation...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Generate Automation Plan
                    </>
                  )}
                </Button>
              </>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <Card className="tech-card border-0 border-primary/20 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Automation Created Successfully
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Name:</p>
                  <p className="text-sm text-muted-foreground">{result.automation?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Type:</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {result.automation?.trigger_type?.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">AI-Generated Plan:</p>
                  <div className="bg-background rounded-lg p-4 border">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{result.plan}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status:</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={resetForm} variant="outline" className="w-full">
              Create Another Automation
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
