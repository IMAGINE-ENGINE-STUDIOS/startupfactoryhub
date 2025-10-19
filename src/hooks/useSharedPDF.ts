import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface SharedPDFDocument {
  id: string;
  owner_id: string;
  project_id: string | null;
  title: string;
  share_token: string;
  storage_path: string | null;
  pdf_content: any;
  annotations: any[];
  signatures: any[];
  is_active: boolean;
  access_level: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useSharedPDF(shareToken?: string) {
  const { user } = useAuth();
  const [document, setDocument] = useState<SharedPDFDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [signatures, setSignatures] = useState<any[]>([]);

  // Load document by share token (for public access)
  const loadSharedDocument = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shared_pdf_documents")
        .select("*")
        .eq("share_token", token)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      
      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("This document link has expired");
        setDocument(null);
        return;
      }

      setDocument(data as unknown as SharedPDFDocument);
      
      // Load signatures
      await loadSignatures(data.id);
    } catch (error: any) {
      console.error("Error loading shared document:", error);
      toast.error("Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  // Load PDF file from storage
  const loadPDFFile = async (storagePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .download(storagePath);

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error loading PDF file:", error);
      toast.error("Failed to load PDF file");
      return null;
    }
  };

  // Load signatures for a document
  const loadSignatures = async (documentId: string) => {
    try {
      const { data, error } = await supabase
        .from("pdf_signatures")
        .select("*")
        .eq("document_id", documentId)
        .order("signed_at", { ascending: false });

      if (error) throw error;
      setSignatures(data || []);
    } catch (error: any) {
      console.error("Error loading signatures:", error);
    }
  };

  // Add signature to document
  const addSignature = async (
    documentId: string,
    signerName: string,
    signerEmail: string | null,
    signatureData: string,
    signatureType: "draw" | "text",
    position: { x: number; y: number },
    pageNumber: number
  ) => {
    try {
      const { error } = await supabase.from("pdf_signatures").insert({
        document_id: documentId,
        signer_name: signerName,
        signer_email: signerEmail,
        signature_data: signatureData,
        signature_type: signatureType,
        position,
        page_number: pageNumber,
      });

      if (error) throw error;
      
      toast.success("Signature added successfully!");
      await loadSignatures(documentId);
      return true;
    } catch (error: any) {
      console.error("Error adding signature:", error);
      toast.error("Failed to add signature");
      return false;
    }
  };

  // Create new shared document with PDF file upload
  const createSharedDocument = async (
    projectId: string | null,
    title: string,
    pdfFile: File,
    accessLevel: 'view' | 'sign' | 'edit' = 'view',
    expiresAt?: Date
  ) => {
    if (!user) {
      toast.error("Please sign in to share documents");
      return null;
    }

    try {
      // Upload PDF to storage
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pdf-documents')
        .upload(fileName, pdfFile);

      if (uploadError) throw uploadError;

      // Create shared document record
      const { data, error } = await supabase
        .from("shared_pdf_documents")
        .insert({
          owner_id: user.id,
          project_id: projectId,
          title,
          storage_path: fileName,
          access_level: accessLevel,
          expires_at: expiresAt?.toISOString(),
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      const shareUrl = `${window.location.origin}/shared-pdf/${data.share_token}`;
      toast.success("PDF shared successfully!");
      return { shareUrl, shareToken: data.share_token, documentId: data.id };
    } catch (error: any) {
      console.error("Error creating shared document:", error);
      toast.error("Failed to create shareable link");
      return null;
    }
  };

  // Send email invitation
  const sendEmailInvitation = async (
    shareToken: string,
    documentTitle: string,
    recipientEmail: string,
    senderName: string,
    message?: string,
    accessLevel: 'view' | 'sign' | 'edit' = 'sign'
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-pdf-signature-request', {
        body: {
          to: recipientEmail,
          documentTitle,
          shareToken,
          senderName,
          message,
          accessLevel,
        }
      });

      if (error) throw error;
      toast.success(`Invitation sent to ${recipientEmail}`);
      return true;
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error("Failed to send invitation email");
      return false;
    }
  };

  // Update document annotations
  const updateAnnotations = async (documentId: string, annotations: any[]) => {
    try {
      const { error } = await supabase
        .from("shared_pdf_documents")
        .update({ annotations } as any)
        .eq("id", documentId);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating annotations:", error);
      toast.error("Failed to update annotations");
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!shareToken || !document) return;

    const channel = supabase
      .channel(`pdf-${shareToken}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pdf_signatures",
          filter: `document_id=eq.${document.id}`,
        },
        (payload) => {
          toast.info(`${payload.new.signer_name} just signed the document`);
          loadSignatures(document.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shared_pdf_documents",
          filter: `id=eq.${document.id}`,
        },
        (payload) => {
          setDocument(payload.new as unknown as SharedPDFDocument);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [shareToken, document?.id]);

  // Save signature to library
  const saveSignatureToLibrary = async (
    signatureData: string,
    signatureType: 'draw' | 'text'
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('pdf_editor_signatures')
        .insert({
          user_id: user.id,
          signature_type: signatureType,
          signature_data: signatureData,
          is_default: false,
        });

      if (error) throw error;
      toast.success("Signature saved to your library");
    } catch (error: any) {
      console.error("Error saving signature:", error);
    }
  };

  return {
    document,
    loading,
    signatures,
    loadSharedDocument,
    loadPDFFile,
    addSignature,
    createSharedDocument,
    sendEmailInvitation,
    updateAnnotations,
    saveSignatureToLibrary,
  };
}