import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface HomeLayoutState {
  order: string[];
  hidden: string[];
}

export const useHomeLayout = (defaultOrder: string[]) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [hidden, setHidden] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const normalize = useCallback(
    (saved: string[]) => {
      const known = saved.filter((k) => defaultOrder.includes(k));
      const missing = defaultOrder.filter((k) => !known.includes(k));
      return [...known, ...missing];
    },
    [defaultOrder]
  );

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("home_layout")
        .select("section_order, hidden_sections")
        .eq("id", "home")
        .maybeSingle();
      if (!active) return;
      const savedOrder = (data?.section_order as string[] | null) ?? [];
      if (savedOrder.length) setOrder(normalize(savedOrder));
      setHidden(((data?.hidden_sections as string[] | null) ?? []).filter((k) => defaultOrder.includes(k)));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [normalize, defaultOrder]);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  const save = useCallback(
    async (nextOrder: string[], nextHidden: string[]) => {
      setSaving(true);
      const { error } = await supabase.from("home_layout").upsert(
        {
          id: "home",
          section_order: nextOrder,
          hidden_sections: nextHidden,
          updated_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      setSaving(false);
      return !error;
    },
    [user]
  );

  return { order, setOrder, hidden, setHidden, isAdmin, loading, saving, save };
};
