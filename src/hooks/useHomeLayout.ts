import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SectionStyle {
  text?: string;
  background?: string;
  accent?: string;
}

export type SectionStyles = Record<string, SectionStyle>;
/** sectionKey -> { textNodeIndex: newText } */
export type TextOverrides = Record<string, Record<string, string>>;

export interface HomeLayoutState {
  order: string[];
  hidden: string[];
}

export const useHomeLayout = (defaultOrder: string[]) => {
  const { user } = useAuth();
  const [order, setOrder] = useState<string[]>(defaultOrder);
  const [hidden, setHidden] = useState<string[]>([]);
  const [styles, setStyles] = useState<SectionStyles>({});
  const [texts, setTexts] = useState<TextOverrides>({});
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
        .select("section_order, hidden_sections, section_styles, text_overrides")
        .eq("id", "home")
        .maybeSingle();
      if (!active) return;
      const row = data as unknown as {
        section_order?: string[] | null;
        hidden_sections?: string[] | null;
        section_styles?: SectionStyles | null;
        text_overrides?: TextOverrides | null;
      } | null;
      const savedOrder = row?.section_order ?? [];
      if (savedOrder.length) setOrder(normalize(savedOrder));
      setHidden((row?.hidden_sections ?? []).filter((k) => defaultOrder.includes(k)));
      setStyles(row?.section_styles ?? {});
      setTexts(row?.text_overrides ?? {});
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
    async (
      nextOrder: string[],
      nextHidden: string[],
      nextStyles: SectionStyles = {},
      nextTexts: TextOverrides = {}
    ) => {
      setSaving(true);
      const { error } = await supabase.from("home_layout").upsert(
        {
          id: "home",
          section_order: nextOrder,
          hidden_sections: nextHidden,
          section_styles: nextStyles,
          text_overrides: nextTexts,
          updated_by: user?.id ?? null,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "id" }
      );
      setSaving(false);
      return !error;
    },
    [user]
  );

  return {
    order,
    setOrder,
    hidden,
    setHidden,
    styles,
    setStyles,
    texts,
    setTexts,
    isAdmin,
    loading,
    saving,
    save,
  };
};
