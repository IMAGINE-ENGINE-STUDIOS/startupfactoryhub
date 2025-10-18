import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, MoreVertical, Trash2, Calendar, DollarSign, Mail, Phone, CheckSquare, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

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
  status: string;
  tasks: Task[];
  notes: string | null;
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
  const [editingCard, setEditingCard] = useState<CRMCard | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
    status: "active",
    tasks: [] as Task[],
    notes: "",
  });

  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    if (user) {
      initializePipeline();
    }
  }, [user]);

  const initializePipeline = async () => {
    try {
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
        cards: cardsData.filter((card) => card.stage_id === stage.id).map(card => ({
          ...card,
          status: (card as any).status || "active",
          tasks: (card as any).tasks || [],
          notes: (card as any).notes || null
        })),
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
        status: newCard.status,
        tasks: newCard.tasks as any,
        notes: newCard.notes || null,
      } as any);

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
        status: "active",
        tasks: [],
        notes: "",
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

  const updateCard = async () => {
    if (!editingCard) return;

    try {
      const { error } = await supabase
        .from("crm_cards")
        .update({
          title: editingCard.title,
          description: editingCard.description,
          contact_name: editingCard.contact_name,
          contact_email: editingCard.contact_email,
          contact_phone: editingCard.contact_phone,
          deal_value: editingCard.deal_value,
          priority: editingCard.priority,
          due_date: editingCard.due_date,
          status: editingCard.status,
          tasks: editingCard.tasks as any,
          notes: editingCard.notes,
        } as any)
        .eq("id", editingCard.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Card updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingCard(null);
      await loadStages(pipelineId!);
    } catch (error: any) {
      console.error("Error updating card:", error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "won":
        return "default";
      case "lost":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const addTaskToNewCard = () => {
    if (!newTask.trim()) return;
    setNewCard({
      ...newCard,
      tasks: [...newCard.tasks, { id: crypto.randomUUID(), text: newTask, completed: false }],
    });
    setNewTask("");
  };

  const toggleTaskInNewCard = (taskId: string) => {
    setNewCard({
      ...newCard,
      tasks: newCard.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    });
  };

  const removeTaskFromNewCard = (taskId: string) => {
    setNewCard({
      ...newCard,
      tasks: newCard.tasks.filter(task => task.id !== taskId),
    });
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
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
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
                <div className="grid grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={newCard.status} onValueChange={(value) => setNewCard({ ...newCard, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task List</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a task..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTaskToNewCard()}
                    />
                    <Button onClick={addTaskToNewCard} type="button">Add</Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {newCard.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() => toggleTaskInNewCard(task.id)}
                      />
                      <span className={task.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                        {task.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskFromNewCard(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Add internal notes about this client..."
                    value={newCard.notes}
                    onChange={(e) => setNewCard({ ...newCard, notes: e.target.value })}
                    rows={10}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <Button onClick={createCard} className="w-full mt-4">
              Create Client Card
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(stage.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">{stage.name}</CardTitle>
                  <Badge variant="secondary">{stage.cards.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[50vh] overflow-y-auto">
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
                              <DropdownMenuItem onClick={() => { setEditingCard(card); setIsEditDialogOpen(true); }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
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
                          <Badge variant={getStatusColor(card.status)} className="text-xs capitalize">
                            {card.status}
                          </Badge>
                          <Badge variant={getPriorityColor(card.priority)} className="text-xs capitalize">
                            {card.priority}
                          </Badge>
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
                        </div>
                        <div className="flex flex-wrap gap-2">
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
                          {card.tasks && card.tasks.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <CheckSquare className="h-3 w-3 mr-1" />
                              {card.tasks.filter(t => t.completed).length}/{card.tasks.length}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Edit Card Dialog */}
      {editingCard && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={editingCard.description || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Name</label>
                    <Input
                      value={editingCard.contact_name || ""}
                      onChange={(e) => setEditingCard({ ...editingCard, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={editingCard.priority} onValueChange={(value) => setEditingCard({ ...editingCard, priority: value })}>
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
                      value={editingCard.contact_email || ""}
                      onChange={(e) => setEditingCard({ ...editingCard, contact_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={editingCard.contact_phone || ""}
                      onChange={(e) => setEditingCard({ ...editingCard, contact_phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Deal Value ($)</label>
                    <Input
                      type="number"
                      value={editingCard.deal_value || ""}
                      onChange={(e) => setEditingCard({ ...editingCard, deal_value: parseInt(e.target.value) || null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Due Date</label>
                    <Input
                      type="date"
                      value={editingCard.due_date || ""}
                      onChange={(e) => setEditingCard({ ...editingCard, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editingCard.status} onValueChange={(value) => setEditingCard({ ...editingCard, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tasks" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Task List</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a task..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && newTask.trim()) {
                          setEditingCard({
                            ...editingCard,
                            tasks: [...editingCard.tasks, { id: crypto.randomUUID(), text: newTask, completed: false }]
                          });
                          setNewTask("");
                        }
                      }}
                    />
                    <Button
                      onClick={() => {
                        if (newTask.trim()) {
                          setEditingCard({
                            ...editingCard,
                            tasks: [...editingCard.tasks, { id: crypto.randomUUID(), text: newTask, completed: false }]
                          });
                          setNewTask("");
                        }
                      }}
                      type="button"
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {editingCard.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 p-2 border rounded">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={() =>
                          setEditingCard({
                            ...editingCard,
                            tasks: editingCard.tasks.map(t =>
                              t.id === task.id ? { ...t, completed: !t.completed } : t
                            )
                          })
                        }
                      />
                      <span className={task.completed ? "line-through text-muted-foreground flex-1" : "flex-1"}>
                        {task.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingCard({
                            ...editingCard,
                            tasks: editingCard.tasks.filter(t => t.id !== task.id)
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Add internal notes about this client..."
                    value={editingCard.notes || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                    rows={10}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <Button onClick={updateCard} className="w-full mt-4">
              Update Client Card
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
