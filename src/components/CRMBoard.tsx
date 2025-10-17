import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, MoreVertical, Trash2, Calendar, DollarSign, Mail, Phone } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CRMCard {
  id: string;
  stage_id: string;
  title: string;
  description: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  deal_value: number | null;
  priority: string;
  due_date: string | null;
  tags: string[] | null;
}

interface CRMStage {
  id: string;
  name: string;
  color: string;
  position: number;
  cards: CRMCard[];
}

export default function CRMBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stages, setStages] = useState<CRMStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [pipelineId, setPipelineId] = useState<string | null>(null);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [draggedCard, setDraggedCard] = useState<CRMCard | null>(null);

  // New card form state
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    deal_value: "",
    priority: "medium",
    due_date: "",
  });

  useEffect(() => {
    if (user) {
      initializePipeline();
    }
  }, [user]);

  const initializePipeline = async () => {
    try {
      // Check if user has a pipeline
      const { data: pipelines, error: pipelineError } = await supabase
        .from("crm_pipelines")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      if (pipelineError) throw pipelineError;

      let currentPipelineId: string;

      if (pipelines && pipelines.length > 0) {
        currentPipelineId = pipelines[0].id;
      } else {
        // Create default pipeline
        const { data: newPipeline, error: createError } = await supabase
          .from("crm_pipelines")
          .insert({
            user_id: user!.id,
            name: "Sales Pipeline",
            description: "Default sales pipeline",
          })
          .select()
          .single();

        if (createError) throw createError;
        currentPipelineId = newPipeline.id;

        // Create default stages
        const defaultStages = [
          { name: "Leads", color: "blue", position: 0 },
          { name: "Contacted", color: "purple", position: 1 },
          { name: "Meeting", color: "yellow", position: 2 },
          { name: "Proposal", color: "orange", position: 3 },
          { name: "Closed", color: "green", position: 4 },
        ];

        await supabase.from("crm_stages").insert(
          defaultStages.map((stage) => ({
            ...stage,
            pipeline_id: currentPipelineId,
          }))
        );
      }

      setPipelineId(currentPipelineId);
      await loadStages(currentPipelineId);
    } catch (error: any) {
      console.error("Error initializing pipeline:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStages = async (pId: string) => {
    try {
      const { data: stagesData, error: stagesError } = await supabase
        .from("crm_stages")
        .select("*")
        .eq("pipeline_id", pId)
        .order("position");

      if (stagesError) throw stagesError;

      const { data: cardsData, error: cardsError } = await supabase
        .from("crm_cards")
        .select("*")
        .in(
          "stage_id",
          stagesData.map((s) => s.id)
        )
        .order("position");

      if (cardsError) throw cardsError;

      const stagesWithCards = stagesData.map((stage) => ({
        ...stage,
        cards: cardsData.filter((card) => card.stage_id === stage.id),
      }));

      setStages(stagesWithCards);
    } catch (error: any) {
      console.error("Error loading stages:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createCard = async () => {
    if (!newCard.title.trim() || !selectedStageId) {
      toast({
        title: "Error",
        description: "Please fill in the card title and select a stage",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("crm_cards").insert({
        stage_id: selectedStageId,
        user_id: user!.id,
        title: newCard.title,
        description: newCard.description || null,
        contact_name: newCard.contact_name || null,
        contact_email: newCard.contact_email || null,
        contact_phone: newCard.contact_phone || null,
        deal_value: newCard.deal_value ? parseInt(newCard.deal_value) : null,
        priority: newCard.priority,
        due_date: newCard.due_date || null,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Card created successfully",
      });

      setNewCard({
        title: "",
        description: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        deal_value: "",
        priority: "medium",
        due_date: "",
      });
      setIsCardDialogOpen(false);
      await loadStages(pipelineId!);
    } catch (error: any) {
      console.error("Error creating card:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase.from("crm_cards").delete().eq("id", cardId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Card deleted successfully",
      });

      await loadStages(pipelineId!);
    } catch (error: any) {
      console.error("Error deleting card:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (card: CRMCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedCard || draggedCard.stage_id === stageId) {
      setDraggedCard(null);
      return;
    }

    try {
      const { error } = await supabase
        .from("crm_cards")
        .update({ stage_id: stageId })
        .eq("id", draggedCard.id);

      if (error) throw error;

      await loadStages(pipelineId!);
      setDraggedCard(null);
    } catch (error: any) {
      console.error("Error moving card:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Pipeline</h2>
          <p className="text-muted-foreground">Track and manage your client relationships</p>
        </div>
        <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedStageId(stages[0]?.id || "")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="e.g., Acme Corp Deal"
                  value={newCard.title}
                  onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Add details about this client..."
                  value={newCard.description}
                  onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contact Name</label>
                  <Input
                    placeholder="John Doe"
                    value={newCard.contact_name}
                    onChange={(e) => setNewCard({ ...newCard, contact_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={newCard.priority} onValueChange={(value) => setNewCard({ ...newCard, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={newCard.contact_email}
                    onChange={(e) => setNewCard({ ...newCard, contact_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    placeholder="+1 (555) 000-0000"
                    value={newCard.contact_phone}
                    onChange={(e) => setNewCard({ ...newCard, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deal Value ($)</label>
                  <Input
                    type="number"
                    placeholder="50000"
                    value={newCard.deal_value}
                    onChange={(e) => setNewCard({ ...newCard, deal_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={newCard.due_date}
                    onChange={(e) => setNewCard({ ...newCard, due_date: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={createCard} className="w-full">
                Create Client Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stage.name}</CardTitle>
                  <Badge variant="secondary">{stage.cards.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                {stage.cards.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No clients yet</p>
                ) : (
                  stage.cards.map((card) => (
                    <Card
                      key={card.id}
                      className="cursor-move hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={() => handleDragStart(card)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold line-clamp-2">{card.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteCard(card.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {card.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
                        )}
                        {card.contact_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{card.contact_name}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {card.contact_email && (
                            <Badge variant="outline" className="text-xs">
                              <Mail className="h-3 w-3 mr-1" />
                              Email
                            </Badge>
                          )}
                          {card.contact_phone && (
                            <Badge variant="outline" className="text-xs">
                              <Phone className="h-3 w-3 mr-1" />
                              Phone
                            </Badge>
                          )}
                          {card.deal_value && (
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${card.deal_value.toLocaleString()}
                            </Badge>
                          )}
                          {card.due_date && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(card.due_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        <Badge variant={getPriorityColor(card.priority)} className="text-xs">
                          {card.priority.toUpperCase()}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
