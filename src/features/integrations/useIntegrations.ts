import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type IntegrationProvider = {
  id: string;
  name: string;
  auth_type: "oauth2" | "oauth2_pkce" | "api_key";
  icon_url: string | null;
  default_scopes: string[];
  docs_url: string | null;
  enabled: boolean;
};

export type UserIntegration = {
  id: string;
  provider_id: string;
  account_label: string | null;
  status: "active" | "revoked" | "error";
  scopes: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useIntegrations() {
  const qc = useQueryClient();

  const providersQuery = useQuery({
    queryKey: ["integration_providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_providers")
        .select("*")
        .eq("enabled", true)
        .order("name");
      if (error) throw error;
      return data as IntegrationProvider[];
    },
  });

  const connectionsQuery = useQuery({
    queryKey: ["user_integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_integrations")
        .select("id,provider_id,account_label,status,scopes,expires_at,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as UserIntegration[];
    },
  });

  const startOAuth = useMutation({
    mutationFn: async (provider_id: string) => {
      const { data, error } = await supabase.functions.invoke("integrations-start", {
        body: { provider_id, redirect_to: `${window.location.origin}/tools` },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No OAuth URL returned");
      window.location.href = data.url;
    },
  });

  const setApiKey = useMutation({
    mutationFn: async (params: { provider_id: string; api_key: string }) => {
      const { data, error } = await supabase.functions.invoke("integrations-set-api-key", {
        body: params,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_integrations"] }),
  });

  const disconnect = useMutation({
    mutationFn: async (integration_id: string) => {
      const { data, error } = await supabase.functions.invoke("integrations-disconnect", {
        body: { integration_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_integrations"] }),
  });

  return {
    providers: providersQuery.data ?? [],
    connections: connectionsQuery.data ?? [],
    isLoading: providersQuery.isLoading || connectionsQuery.isLoading,
    startOAuth,
    setApiKey,
    disconnect,
    refetch: () => {
      qc.invalidateQueries({ queryKey: ["user_integrations"] });
      qc.invalidateQueries({ queryKey: ["integration_providers"] });
    },
  };
}
