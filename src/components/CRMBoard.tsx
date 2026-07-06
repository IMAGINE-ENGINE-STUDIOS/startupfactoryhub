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
import { Plus, MoreVertical, Trash2, Calendar, DollarSign, Mail, Phone, CheckSquare, Edit, Briefcase, TrendingUp, Sparkles, Target, GripVertical, Building2, Users, Flame, Download, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<CRMCard | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // New card form state
  const [newCard, setNewCard] = useState({
    title: "",
    description: "",
    company_name: "",
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
        company_name: newCard.company_name || null,
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
        company_name: "",
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
          company_name: (editingCard as any).company_name,
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

  // ── Pipeline-wide insights ──────────────────────────────────────────
  const allCards = stages.flatMap(s => s.cards);
  const totalValue = allCards.reduce((sum, c) => sum + (c.deal_value || 0), 0);
  const activeDeals = allCards.filter(c => c.status === 'active').length;
  const wonDeals = allCards.filter(c => c.status === 'won').length;
  const lostDeals = allCards.filter(c => c.status === 'lost').length;
  const closedDeals = wonDeals + lostDeals;
  const winRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;
  const avgDeal = activeDeals > 0
    ? Math.round(allCards.filter(c => c.status === 'active').reduce((s, c) => s + (c.deal_value || 0), 0) / activeDeals)
    : 0;

  const fmtMoney = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}k` : `$${n}`;

  const priorityDot: Record<string, string> = {
    high: 'bg-rose-500 shadow-[0_0_10px_hsl(346_82%_60%/0.8)]',
    medium: 'bg-amber-400 shadow-[0_0_8px_hsl(45_93%_60%/0.6)]',
    low: 'bg-emerald-400 shadow-[0_0_8px_hsl(160_84%_55%/0.5)]',
  };

  const initials = (s: string | null) =>
    (s || '?')
      .split(' ')
      .map(p => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const dueMeta = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, tone: 'text-rose-400 bg-rose-500/10' };
    if (diff === 0) return { label: 'Today', tone: 'text-amber-400 bg-amber-500/10' };
    if (diff <= 7) return { label: `${diff}d left`, tone: 'text-amber-400 bg-amber-500/10' };
    return { label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tone: 'text-muted-foreground bg-muted/40' };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Hero pipeline header ──────────────────────────────────────── */}
      <div className="relative tech-card border-0 rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-2.5 py-1 w-fit">
              <Sparkles className="w-3 h-3" /> Pipeline intelligence
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Client{' '}
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                pipeline
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">Drag, drop and close — your deal flow in motion.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 lg:min-w-[520px]">
            <CRMKpi icon={DollarSign} label="Pipeline" value={fmtMoney(totalValue)} tone="text-primary" />
            <CRMKpi icon={Briefcase} label="Active" value={activeDeals} tone="text-violet-400" />
            <CRMKpi icon={TrendingUp} label="Win rate" value={`${winRate}%`} tone="text-emerald-400" />
            <CRMKpi icon={Target} label="Avg deal" value={fmtMoney(avgDeal)} tone="text-amber-400" />
          </div>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Users className="w-3.5 h-3.5" /> {allCards.length} cards · {stages.length} stages
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    placeholder="e.g., Acme Corporation"
                    value={newCard.company_name}
                    onChange={(e) => setNewCard({ ...newCard, company_name: e.target.value })}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {stages.map((stage, sIdx) => {
          const stageValue = stage.cards.reduce((s, c) => s + (c.deal_value || 0), 0);
          const isOver = dragOverStageId === stage.id && draggedCard && draggedCard.stage_id !== stage.id;
          const stageAccent = stage.color || ['hsl(var(--primary))', 'hsl(260 84% 70%)', 'hsl(160 84% 55%)', 'hsl(45 93% 60%)', 'hsl(340 82% 65%)'][sIdx % 5];

          return (
            <div
              key={stage.id}
              onDragOver={(e) => { handleDragOver(e); setDragOverStageId(stage.id); }}
              onDragLeave={() => setDragOverStageId(prev => prev === stage.id ? null : prev)}
              onDrop={() => { handleDrop(stage.id); setDragOverStageId(null); }}
              className={cn(
                'relative tech-card border-0 rounded-2xl p-3 transition-all overflow-hidden',
                isOver && 'ring-2 ring-primary/60 scale-[1.01]',
              )}
            >
              <div
                className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                style={{ background: `linear-gradient(90deg, ${stageAccent}, transparent)` }}
              />

              {/* Column header */}
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/40">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: stageAccent, boxShadow: `0 0 10px ${stageAccent}` }}
                  />
                  <h3 className="font-semibold text-sm uppercase tracking-wider truncate">{stage.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {stageValue > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground tabular-nums">
                      {fmtMoney(stageValue)}
                    </span>
                  )}
                  <span className="text-[10px] font-bold tabular-nums bg-muted/50 text-foreground rounded-full px-2 py-0.5 min-w-[22px] text-center">
                    {stage.cards.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[58vh] overflow-y-auto pr-1 -mr-1">
                {stage.cards.length === 0 ? (
                  <button
                    onClick={() => { setSelectedStageId(stage.id); setIsCardDialogOpen(true); }}
                    className="w-full text-xs text-muted-foreground/70 hover:text-primary border border-dashed border-border/50 hover:border-primary/50 rounded-xl py-6 transition-colors"
                  >
                    <Plus className="w-4 h-4 mx-auto mb-1 opacity-60" />
                    Drop or add card
                  </button>
                ) : (
                  stage.cards.map(card => {
                    const taskTotal = card.tasks?.length || 0;
                    const taskDone = card.tasks?.filter(t => t.completed).length || 0;
                    const taskPct = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
                    const due = dueMeta(card.due_date);
                    const dragging = draggedCard?.id === card.id;
                    const companyName = (card as any).company_name as string | undefined;

                    return (
                      <div
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card)}
                        onDragEnd={() => { setDraggedCard(null); setDragOverStageId(null); }}
                        onClick={() => { setEditingCard(card); setIsEditDialogOpen(true); }}
                        className={cn(
                          'group relative cursor-grab active:cursor-grabbing tech-card border-0 rounded-xl p-3 transition-all',
                          'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.2)]',
                          dragging && 'opacity-50 rotate-1',
                          card.status === 'won' && 'ring-1 ring-emerald-500/40',
                          card.status === 'lost' && 'opacity-60',
                        )}
                      >
                        {/* Priority strip */}
                        <span
                          className={cn(
                            'absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full',
                            card.priority === 'high'
                              ? 'bg-rose-500'
                              : card.priority === 'medium'
                                ? 'bg-amber-400'
                                : 'bg-emerald-400',
                          )}
                        />

                        {/* Header row */}
                        <div className="flex items-start gap-2 pl-1.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-primary/5 ring-1 ring-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {initials(card.contact_name || companyName || card.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                              {card.title}
                            </h4>
                            {(companyName || card.contact_name) && (
                              <div className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                <Building2 className="w-2.5 h-2.5 shrink-0" />
                                {companyName || card.contact_name}
                              </div>
                            )}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingCard(card); setIsEditDialogOpen(true); }}>
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteCard(card.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Deal value + due */}
                        {(card.deal_value || due) && (
                          <div className="flex items-center justify-between mt-2.5 pl-1.5 gap-2">
                            {card.deal_value ? (
                              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 tabular-nums">
                                <DollarSign className="w-3 h-3" />
                                {fmtMoney(card.deal_value)}
                              </div>
                            ) : <span />}
                            {due && (
                              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-flex items-center gap-1', due.tone)}>
                                <Calendar className="w-2.5 h-2.5" />
                                {due.label}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Task progress */}
                        {taskTotal > 0 && (
                          <div className="mt-2.5 pl-1.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <CheckSquare className="w-2.5 h-2.5" /> {taskDone}/{taskTotal}
                              </span>
                              <span className="tabular-nums">{taskPct}%</span>
                            </div>
                            <Progress value={taskPct} className="h-1" />
                          </div>
                        )}

                        {/* Footer chips */}
                        <div className="flex items-center gap-1.5 mt-2.5 pl-1.5 flex-wrap">
                          {card.contact_email && (
                            <span className="w-5 h-5 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground" title={card.contact_email}>
                              <Mail className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {card.contact_phone && (
                            <span className="w-5 h-5 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground" title={card.contact_phone}>
                              <Phone className="w-2.5 h-2.5" />
                            </span>
                          )}
                          {card.status === 'won' && (
                            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-emerald-400 inline-flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> Won
                            </span>
                          )}
                          {card.status === 'lost' && (
                            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Lost
                            </span>
                          )}
                          {card.priority === 'high' && card.status === 'active' && (
                            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-rose-400 inline-flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5" /> Hot
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    placeholder="e.g., Acme Corporation"
                    value={(editingCard as any).company_name || ""}
                    onChange={(e) => setEditingCard({ ...editingCard, company_name: e.target.value } as any)}
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

function CRMKpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string | number;
  tone: string;
}) {
  return (
    <div className="relative rounded-xl bg-background/40 border border-border/40 px-3 py-2.5 backdrop-blur-sm">
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground`}>
        <Icon className={`w-3 h-3 ${tone}`} />
        {label}
      </div>
      <div className={`text-lg sm:text-xl font-bold tabular-nums mt-0.5 ${tone}`}>{value}</div>
    </div>
  );
}
