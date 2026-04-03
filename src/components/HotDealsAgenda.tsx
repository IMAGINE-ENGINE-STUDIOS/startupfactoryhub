import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AgendaItem {
  id: string;
  time_slot: string;
  title: string;
  description: string | null;
  sort_order: number;
}

const ADMIN_PASSWORD = "StartupFactoryHot";

const HotDealsAgenda = () => {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ time_slot: "", title: "", description: "" });
  const [newItem, setNewItem] = useState({ time_slot: "", title: "", description: "" });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchAgenda(); }, []);

  // Auto-cycle ticker
  useEffect(() => {
    if (items.length <= 1 || expanded) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length, expanded]);

  const fetchAgenda = async () => {
    const { data } = await supabase
      .from("hot_deals_agenda")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data);
  };

  const handleAdminLogin = () => {
    const pwd = prompt("Enter admin password:");
    if (pwd === ADMIN_PASSWORD) setIsAdmin(true);
    else if (pwd !== null) alert("Incorrect password");
  };

  const startEdit = (item: AgendaItem) => {
    setEditingId(item.id);
    setEditForm({ time_slot: item.time_slot, title: item.title, description: item.description || "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from("hot_deals_agenda").update({
      time_slot: editForm.time_slot, title: editForm.title, description: editForm.description || null,
    }).eq("id", editingId);
    setEditingId(null);
    fetchAgenda();
  };

  const addItem = async () => {
    if (!newItem.time_slot || !newItem.title) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;
    await supabase.from("hot_deals_agenda").insert({
      time_slot: newItem.time_slot, title: newItem.title,
      description: newItem.description || null, sort_order: maxOrder + 1,
    });
    setNewItem({ time_slot: "", title: "", description: "" });
    setShowAdd(false);
    fetchAgenda();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this agenda item?")) return;
    await supabase.from("hot_deals_agenda").delete().eq("id", id);
    fetchAgenda();
  };

  const current = items[currentIndex];

  return (
    <div className="tech-card rounded-xl border border-orange-400/10 overflow-hidden">
      {/* Ticker bar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-orange-400/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm">🔥</span>
        <span className="text-orange-400 text-[10px] font-futuristic font-bold tracking-wider shrink-0">AGENDA</span>
        {current && (
          <div className="flex items-center gap-2 min-w-0 flex-1 animate-fade-in" key={current.id}>
            <span className="text-orange-400 font-mono text-xs font-semibold shrink-0">{current.time_slot}</span>
            <span className="text-foreground text-xs truncate">{current.title}</span>
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {/* Progress dots */}
          <div className="flex gap-1">
            {items.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentIndex ? "bg-orange-400" : "bg-orange-400/20"}`} />
            ))}
          </div>
          <span className="text-muted-foreground text-[10px]">{expanded ? "▲" : "▼"}</span>
          {!isAdmin && (
            <button onClick={(e) => { e.stopPropagation(); handleAdminLogin(); }} className="text-[10px] text-muted-foreground/50 hover:text-orange-400 transition-colors font-mono">
              EDIT
            </button>
          )}
        </div>
      </div>

      {/* Expanded full agenda */}
      {expanded && (
        <div className="border-t border-orange-400/10 px-4 py-3 space-y-1.5 max-h-[300px] overflow-y-auto">
          {items.map((item, i) => (
            <div key={item.id}>
              {editingId === item.id ? (
                <div className="space-y-2 p-2 border border-orange-400/20 rounded-lg">
                  <div className="flex gap-2">
                    <Input value={editForm.time_slot} onChange={(e) => setEditForm({ ...editForm, time_slot: e.target.value })} placeholder="Time" className="w-24 text-xs border-orange-400/30" />
                    <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" className="flex-1 text-xs border-orange-400/30" />
                  </div>
                  <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" className="text-xs border-orange-400/30" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7">Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-xs h-7">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-start gap-3 py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${i === currentIndex ? "bg-orange-400/10" : "hover:bg-orange-400/5"}`}
                  onClick={() => setCurrentIndex(i)}
                >
                  <span className="text-orange-400 font-mono text-xs font-semibold whitespace-nowrap min-w-[70px]">{item.time_slot}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">{item.title}</p>
                    {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(item); }} className="text-[10px] text-orange-400 hover:text-orange-300">edit</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="text-[10px] text-red-400 hover:text-red-300">del</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isAdmin && (
            <div className="pt-2 border-t border-orange-400/10">
              {showAdd ? (
                <div className="space-y-2 p-2 border border-orange-400/20 rounded-lg">
                  <div className="flex gap-2">
                    <Input value={newItem.time_slot} onChange={(e) => setNewItem({ ...newItem, time_slot: e.target.value })} placeholder="Time" className="w-24 text-xs border-orange-400/30" />
                    <Input value={newItem.title} onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} placeholder="Title" className="flex-1 text-xs border-orange-400/30" />
                  </div>
                  <Input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Description" className="text-xs border-orange-400/30" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addItem} className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7">Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs h-7">Cancel</Button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAdd(true)} className="text-xs text-orange-400 hover:text-orange-300 font-mono">+ Add Item</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HotDealsAgenda;
