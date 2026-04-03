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
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ time_slot: "", title: "", description: "" });
  const [newItem, setNewItem] = useState({ time_slot: "", title: "", description: "" });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    fetchAgenda();
  }, []);

  const fetchAgenda = async () => {
    const { data } = await supabase
      .from("hot_deals_agenda")
      .select("*")
      .order("sort_order", { ascending: true });
    if (data) setItems(data);
  };

  const handleAdminLogin = () => {
    const pwd = prompt("Enter admin password:");
    if (pwd === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else if (pwd !== null) {
      alert("Incorrect password");
    }
  };

  const startEdit = (item: AgendaItem) => {
    setEditingId(item.id);
    setEditForm({ time_slot: item.time_slot, title: item.title, description: item.description || "" });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from("hot_deals_agenda").update({
      time_slot: editForm.time_slot,
      title: editForm.title,
      description: editForm.description || null,
    }).eq("id", editingId);
    setEditingId(null);
    fetchAgenda();
  };

  const addItem = async () => {
    if (!newItem.time_slot || !newItem.title) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : 0;
    await supabase.from("hot_deals_agenda").insert({
      time_slot: newItem.time_slot,
      title: newItem.title,
      description: newItem.description || null,
      sort_order: maxOrder + 1,
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

  return (
    <div className="tech-card rounded-2xl p-4 border border-orange-400/10 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-orange-400 font-futuristic tracking-wider">
          EVENT AGENDA
        </h3>
        {!isAdmin && (
          <button
            onClick={handleAdminLogin}
            className="text-[10px] text-muted-foreground/50 hover:text-orange-400 transition-colors font-mono"
          >
            EDIT
          </button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <div className="space-y-2 p-2 border border-orange-400/20 rounded-lg">
                <div className="flex gap-2">
                  <Input
                    value={editForm.time_slot}
                    onChange={(e) => setEditForm({ ...editForm, time_slot: e.target.value })}
                    placeholder="Time"
                    className="w-24 text-xs border-orange-400/30"
                  />
                  <Input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Title"
                    className="flex-1 text-xs border-orange-400/30"
                  />
                </div>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="text-xs border-orange-400/30"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit} className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7">Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-xs h-7">Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 py-2 border-b border-orange-400/5 last:border-0">
                <span className="text-orange-400 font-mono text-xs font-semibold whitespace-nowrap min-w-[70px]">
                  {item.time_slot}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="text-[10px] text-orange-400 hover:text-orange-300">edit</button>
                    <button onClick={() => deleteItem(item.id)} className="text-[10px] text-red-400 hover:text-red-300">del</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="pt-2 border-t border-orange-400/10">
          {showAdd ? (
            <div className="space-y-2 p-2 border border-orange-400/20 rounded-lg">
              <div className="flex gap-2">
                <Input
                  value={newItem.time_slot}
                  onChange={(e) => setNewItem({ ...newItem, time_slot: e.target.value })}
                  placeholder="Time (e.g. 3:00 PM)"
                  className="w-32 text-xs border-orange-400/30"
                />
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Title"
                  className="flex-1 text-xs border-orange-400/30"
                />
              </div>
              <Input
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                placeholder="Description (optional)"
                className="text-xs border-orange-400/30"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addItem} className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-7">Add</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)} className="text-xs h-7">Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs text-orange-400 hover:text-orange-300 font-mono"
            >
              + Add Item
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HotDealsAgenda;
