import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Save,
  Printer,
  FileText,
  Loader2,
  Link2,
  CreditCard,
  ExternalLink,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import sfhLogo from "@/assets/sfh-logo-combined.png";

type Billing = "one_time" | "monthly" | "yearly";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  billing: Billing;
}

interface SavedProposal {
  id: string;
  proposal_number: string;
  client_name: string;
  client_company: string | null;
  client_email: string | null;
  client_address: string | null;
  title: string;
  notes: string | null;
  terms: string | null;
  issue_date: string;
  valid_until: string | null;
  currency: string;
  items: any;
  tax_rate: number;
  discount: number;
  total: number;
  updated_at: string;
}

const billingLabel: Record<Billing, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

const billingShort: Record<Billing, string> = {
  one_time: "one-time",
  monthly: "/mo",
  yearly: "/yr",
};

const newItem = (): LineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unit_price: 0,
  billing: "one_time",
});

const generateProposalNumber = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SFH-${stamp}-${rand}`;
};

const Invoice = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [proposalNumber, setProposalNumber] = useState(generateProposalNumber());
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState("");
  const [title, setTitle] = useState("Formal Proposal");
  const [currency, setCurrency] = useState("USD");

  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  const [items, setItems] = useState<LineItem[]>([newItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "This proposal is valid for 30 days from the issue date. 50% deposit required to commence work. Final balance due upon delivery."
  );
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string>("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [savedDialogOpen, setSavedDialogOpen] = useState(false);
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  useEffect(() => {
    document.title = "Formal Proposal | Startup Factory Hub";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const sumByBilling = (b: Billing) =>
    items
      .filter((i) => i.billing === b)
      .reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const oneTimeSubtotal = useMemo(() => sumByBilling("one_time"), [items]);
  const monthlySubtotal = useMemo(() => sumByBilling("monthly"), [items]);
  const yearlySubtotal = useMemo(() => sumByBilling("yearly"), [items]);

  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0),
    [items]
  );
  const taxAmount = useMemo(() => (subtotal - discount) * (taxRate / 100), [subtotal, discount, taxRate]);
  const total = useMemo(() => subtotal - discount + taxAmount, [subtotal, discount, taxAmount]);

  const allocate = (amount: number) => (subtotal > 0 ? (amount / subtotal) : 0);
  const monthlyTotal = useMemo(() => {
    const share = allocate(monthlySubtotal);
    return monthlySubtotal - discount * share + taxAmount * share;
  }, [monthlySubtotal, subtotal, discount, taxAmount]);
  const yearlyTotalRecurring = useMemo(() => {
    const share = allocate(yearlySubtotal);
    return yearlySubtotal - discount * share + taxAmount * share;
  }, [yearlySubtotal, subtotal, discount, taxAmount]);
  const oneTimeTotal = useMemo(() => {
    const share = allocate(oneTimeSubtotal);
    return oneTimeSubtotal - discount * share + taxAmount * share;
  }, [oneTimeSubtotal, subtotal, discount, taxAmount]);

  const annualizedTotal = useMemo(
    () => oneTimeTotal + monthlyTotal * 12 + yearlyTotalRecurring,
    [oneTimeTotal, monthlyTotal, yearlyTotalRecurring]
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n || 0);

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const addItem = () => setItems((prev) => [...prev, newItem()]);

  // ---------- SAVE / UPSERT ----------
  const buildPayload = useCallback(() => ({
    proposal_number: proposalNumber,
    client_name: clientName || "Untitled",
    client_email: clientEmail || null,
    client_company: clientCompany || null,
    client_address: clientAddress || null,
    title,
    notes: notes || null,
    terms: terms || null,
    issue_date: issueDate,
    valid_until: validUntil || null,
    currency,
    items: items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity) || 0,
      unit_price: Number(i.unit_price) || 0,
      billing: i.billing,
      amount: (Number(i.quantity) || 0) * (Number(i.unit_price) || 0),
    })),
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount,
    total,
    status: "draft",
    created_by: user?.id ?? null,
  }), [proposalNumber, clientName, clientEmail, clientCompany, clientAddress, title, notes, terms, issueDate, validUntil, currency, items, subtotal, taxRate, taxAmount, discount, total, user]);

  const upsertProposal = useCallback(async () => {
    const payload = buildPayload();
    return await supabase
      .from("proposals")
      .upsert(payload, { onConflict: "proposal_number" });
  }, [buildPayload]);

  const handleSave = async () => {
    if (!clientName.trim()) {
      toast({ title: "Client name required", variant: "destructive" });
      return;
    }
    if (items.every((i) => !i.description.trim())) {
      toast({ title: "Add at least one line item", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await upsertProposal();
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Proposal saved", description: proposalNumber });
    }
  };

  // ---------- AUTOSAVE ----------
  const autosaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!user || role !== "admin") return;
    if (!clientName.trim() && items.every((i) => !i.description.trim())) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      setAutoSaveStatus("saving");
      const { error } = await upsertProposal();
      setAutoSaveStatus(error ? "error" : "saved");
      if (!error) setTimeout(() => setAutoSaveStatus("idle"), 2000);
    }, 1500);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [proposalNumber, clientName, clientCompany, clientEmail, clientAddress, title, notes, terms, issueDate, validUntil, currency, items, taxRate, discount, user, role, upsertProposal]);

  // ---------- LOAD SAVED ----------
  const openSavedDialog = async () => {
    setSavedDialogOpen(true);
    setLoadingSaved(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    setLoadingSaved(false);
    if (error) {
      toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    } else {
      setSavedProposals((data || []) as SavedProposal[]);
    }
  };

  const loadProposal = (p: SavedProposal) => {
    setProposalNumber(p.proposal_number);
    setClientName(p.client_name);
    setClientCompany(p.client_company || "");
    setClientEmail(p.client_email || "");
    setClientAddress(p.client_address || "");
    setTitle(p.title);
    setNotes(p.notes || "");
    setTerms(p.terms || "");
    setIssueDate(p.issue_date);
    setValidUntil(p.valid_until || "");
    setCurrency(p.currency);
    setTaxRate(Number(p.tax_rate) || 0);
    setDiscount(Number(p.discount) || 0);
    const loadedItems = Array.isArray(p.items) ? p.items : [];
    setItems(
      loadedItems.length > 0
        ? loadedItems.map((it: any) => ({
            id: crypto.randomUUID(),
            description: it.description || "",
            quantity: Number(it.quantity) || 0,
            unit_price: Number(it.unit_price) || 0,
            billing: (it.billing as Billing) || "one_time",
          }))
        : [newItem()]
    );
    setPaymentLinkUrl("");
    setSavedDialogOpen(false);
    toast({ title: "Proposal loaded", description: p.proposal_number });
  };

  const newProposal = () => {
    setProposalNumber(generateProposalNumber());
    setClientName("");
    setClientCompany("");
    setClientEmail("");
    setClientAddress("");
    setTitle("Formal Proposal");
    setNotes("");
    setTerms("This proposal is valid for 30 days from the issue date. 50% deposit required to commence work. Final balance due upon delivery.");
    setIssueDate(new Date().toISOString().slice(0, 10));
    setValidUntil("");
    setCurrency("USD");
    setTaxRate(0);
    setDiscount(0);
    setItems([newItem()]);
    setPaymentLinkUrl("");
  };

  const handleGeneratePaymentLink = async () => {
    if (monthlySubtotal > 0 && yearlySubtotal > 0) {
      toast({
        title: "Cannot combine monthly and yearly",
        description: "Stripe Payment Links accept only one recurring interval. Remove monthly OR yearly items.",
        variant: "destructive",
      });
      return;
    }
    if (oneTimeTotal <= 0 && monthlyTotal <= 0 && yearlyTotalRecurring <= 0) {
      toast({ title: "Add at least one priced item", variant: "destructive" });
      return;
    }
    setGeneratingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-proposal-payment-link", {
        body: {
          proposalNumber,
          currency: currency.toLowerCase(),
          oneTimeAmount: Math.round(oneTimeTotal * 100),
          monthlyAmount: Math.round(monthlyTotal * 100),
          yearlyAmount: Math.round(yearlyTotalRecurring * 100),
          clientName,
          clientEmail,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPaymentLinkUrl(data.url);
      toast({ title: "Payment link generated" });
    } catch (e: any) {
      toast({ title: "Failed to generate link", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingLink(false);
    }
  };

  // ---------- OPEN PDF IN NEW TAB ----------
  const handleOpenPdf = async () => {
    setExportingPdf(true);
    try {
      const docEl = document.getElementById("proposal-document");
      if (!docEl) throw new Error("Document not found");
      const html2pdf = (await import("html2pdf.js")).default;
      const blob: Blob = await html2pdf()
        .set({
          margin: 0.4,
          filename: `${proposalNumber}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        } as any)
        .from(docEl)
        .toPdf()
        .output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      toast({ title: "Failed to generate PDF", description: e.message, variant: "destructive" });
    } finally {
      setExportingPdf(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Restricted</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            This page is available to platform administrators only.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Inline editable input style — looks like rendered text but is fully editable
  const editableText = "bg-transparent border-0 border-b border-dashed border-slate-200 hover:border-slate-300 focus-visible:border-emerald-500 focus-visible:ring-0 px-1 h-auto py-0.5 text-slate-900 rounded-none";

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar — hidden on print */}
      <div className="print:hidden border-b border-border/40 bg-card/40 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-mono">{proposalNumber}</span>
            {autoSaveStatus === "saving" && (
              <span className="text-xs flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Autosaving…</span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-xs flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" />Autosaved</span>
            )}
            {autoSaveStatus === "error" && (
              <span className="text-xs text-destructive">Autosave failed</span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={newProposal}>
              <Plus className="h-4 w-4 mr-2" /> New
            </Button>
            <Button variant="outline" size="sm" onClick={openSavedDialog}>
              <FolderOpen className="h-4 w-4 mr-2" /> Saved Proposals
            </Button>
            <Button variant="outline" size="sm" onClick={handleGeneratePaymentLink} disabled={generatingLink}>
              {generatingLink ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {paymentLinkUrl ? "Regenerate Link" : "Payment Link"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenPdf} disabled={exportingPdf}>
              {exportingPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Open PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* PROPOSAL DOCUMENT — same look in editor as in PDF */}
        <div
          id="proposal-document"
          className="bg-white text-slate-900 rounded-lg shadow-2xl print:shadow-none print:rounded-none p-10 print:p-12 print:bg-white"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-6 pb-6 border-b-2 border-emerald-600">
            <div className="flex items-center gap-4">
              <img src={sfhLogo} alt="Startup Factory Hub" className="h-16 w-auto" />
              <div>
                <div className="text-xl font-bold tracking-tight text-slate-900">Startup Factory Hub</div>
                <div className="text-xs text-slate-500">Orlando, Florida • startupfactoryhub.com</div>
                <div className="text-xs text-slate-500">hello@startupfactoryhub.com</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold uppercase tracking-widest text-emerald-700">
                Proposal
              </div>
              <div className="mt-1 text-xs text-slate-500">No.</div>
              <div className="font-mono text-sm font-semibold text-slate-800">{proposalNumber}</div>
            </div>
          </div>

          {/* Meta + Client */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                Prepared For
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={`${editableText} font-semibold text-base`}
                />
                <Input
                  placeholder="Company"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className={editableText}
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className={`${editableText} text-sm text-slate-600`}
                />
                <Textarea
                  placeholder="Address"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className={`${editableText} text-sm text-slate-600 min-h-[40px] resize-none`}
                />
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                Details
              </div>
              <div className="space-y-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Proposal title"
                  className={`${editableText} font-semibold text-base`}
                />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-sm">
                    <Label className="text-xs text-slate-500">Issue Date</Label>
                    <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={editableText} />
                  </div>
                  <div className="text-sm">
                    <Label className="text-xs text-slate-500">Valid Until</Label>
                    <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={editableText} />
                  </div>
                </div>
                <div className="text-sm">
                  <Label className="text-xs text-slate-500">Currency</Label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} className={editableText} />
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="mt-8">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
              Scope & Deliverables
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="text-left p-3 font-semibold">Description</th>
                  <th className="text-left p-3 font-semibold w-32">Billing</th>
                  <th className="text-right p-3 font-semibold w-20">Qty</th>
                  <th className="text-right p-3 font-semibold w-32">Unit Price</th>
                  <th className="text-right p-3 font-semibold w-36">Amount</th>
                  <th className="w-10 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const amount = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
                  return (
                    <tr key={item.id} className={idx % 2 ? "bg-slate-50" : "bg-white"}>
                      <td className="p-2 align-top">
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(item.id, { description: e.target.value })}
                          placeholder="Item / service description"
                          className="bg-transparent border-0 focus-visible:ring-0 text-slate-900 min-h-[40px] resize-none p-1"
                        />
                      </td>
                      <td className="p-2 align-top">
                        <div className="print:hidden">
                          <Select
                            value={item.billing}
                            onValueChange={(v) => updateItem(item.id, { billing: v as Billing })}
                          >
                            <SelectTrigger className="bg-transparent border-0 text-slate-900 h-9 focus:ring-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background backdrop-blur-none">
                              <SelectItem value="one_time">One-time</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="hidden print:block text-xs">{billingLabel[item.billing]}</div>
                      </td>
                      <td className="p-2 align-top text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          className="bg-transparent border-0 focus-visible:ring-0 text-slate-900 text-right"
                        />
                      </td>
                      <td className="p-2 align-top text-right">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="bg-transparent border-0 focus-visible:ring-0 text-slate-900 text-right"
                        />
                      </td>
                      <td className="p-3 align-top text-right font-semibold tabular-nums">
                        {fmt(amount)}
                        <div className="text-[10px] font-normal text-slate-500 uppercase tracking-wide">
                          {billingShort[item.billing]}
                        </div>
                      </td>
                      <td className="p-2 align-top print:hidden">
                        {items.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-slate-500 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="print:hidden mt-3">
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="tabular-nums font-medium">{fmt(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Discount</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="bg-transparent border-0 focus-visible:ring-0 text-slate-900 text-right h-7 w-28 tabular-nums"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Tax (%)</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="bg-transparent border-0 focus-visible:ring-0 text-slate-900 text-right h-7 w-16"
                  />
                  <span className="tabular-nums w-20 text-right">{fmt(taxAmount)}</span>
                </div>
              </div>
              <Separator className="bg-slate-200" />

              <div className="space-y-1.5 pt-1">
                {oneTimeSubtotal > 0 && (
                  <div className="flex justify-between items-center text-sm bg-slate-100 px-3 py-2 rounded">
                    <span className="text-slate-700 font-medium">One-time Total</span>
                    <span className="tabular-nums font-semibold">{fmt(oneTimeTotal)}</span>
                  </div>
                )}
                {monthlySubtotal > 0 && (
                  <div className="flex justify-between items-center text-sm bg-emerald-50 px-3 py-2 rounded border border-emerald-100">
                    <span className="text-slate-700 font-medium">Monthly Total</span>
                    <span className="tabular-nums font-semibold text-emerald-700">
                      {fmt(monthlyTotal)}<span className="text-xs text-slate-500"> /mo</span>
                    </span>
                  </div>
                )}
                {yearlySubtotal > 0 && (
                  <div className="flex justify-between items-center text-sm bg-emerald-50 px-3 py-2 rounded border border-emerald-100">
                    <span className="text-slate-700 font-medium">Yearly Total</span>
                    <span className="tabular-nums font-semibold text-emerald-700">
                      {fmt(yearlyTotalRecurring)}<span className="text-xs text-slate-500"> /yr</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-lg font-bold bg-emerald-700 text-white px-4 py-3 rounded mt-2">
                <span>TOTAL</span>
                <span className="tabular-nums">{fmt(total)}</span>
              </div>

              {(monthlySubtotal > 0 || yearlySubtotal > 0) && (
                <div className="flex justify-between items-center text-sm bg-slate-900 text-white px-4 py-2.5 rounded">
                  <div className="flex flex-col">
                    <span className="font-semibold">Annualized Value</span>
                    <span className="text-[10px] text-slate-400">one-time + monthly×12 + yearly</span>
                  </div>
                  <span className="tabular-nums font-bold">{fmt(annualizedTotal)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="grid grid-cols-2 gap-8 mt-10">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Notes</div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes for the client..."
                className="bg-transparent border border-dashed border-slate-200 focus-visible:ring-0 focus-visible:border-emerald-500 text-sm text-slate-700 min-h-[80px]"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Terms & Conditions</div>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="bg-transparent border border-dashed border-slate-200 focus-visible:ring-0 focus-visible:border-emerald-500 text-sm text-slate-700 min-h-[80px]"
              />
            </div>
          </div>

          {/* Payment Link & QR */}
          {paymentLinkUrl && (
            <div className="mt-10 pt-6 border-t-2 border-emerald-600">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">
                Pay Online
              </div>
              <div className="flex items-start gap-6 bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                <div className="bg-white p-2 rounded border border-emerald-200">
                  <QRCodeSVG value={paymentLinkUrl} size={120} level="M" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-900 mb-1">
                    Secure payment via Stripe
                  </div>
                  <div className="text-xs text-slate-600 mb-2">
                    Scan the QR code or open the link below to pay {fmt(total)}
                    {(monthlySubtotal > 0 || yearlySubtotal > 0) && " and set up recurring billing"}.
                  </div>
                  <a
                    href={paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-700 underline break-all inline-flex items-start gap-1"
                  >
                    <Link2 className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>{paymentLinkUrl}</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
            Thank you for considering Startup Factory Hub. We look forward to building the future together.
          </div>
        </div>
      </div>

      {/* Saved Proposals dialog */}
      <Dialog open={savedDialogOpen} onOpenChange={setSavedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saved Proposals</DialogTitle>
            <DialogDescription>Click a proposal to load it for editing.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
            {loadingSaved ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : savedProposals.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No proposals saved yet.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {savedProposals.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => loadProposal(p)}
                      className="w-full text-left px-3 py-3 hover:bg-accent/40 rounded transition-colors flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {p.client_name}{p.client_company ? ` — ${p.client_company}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">{p.proposal_number}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(p.updated_at).toLocaleString()} • {p.title}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums shrink-0">
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "USD" }).format(Number(p.total) || 0)}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body { background: white !important; }
          @page { size: letter; margin: 0.4in; }
          body * { visibility: hidden !important; }
          #proposal-document, #proposal-document * { visibility: visible !important; }
          #proposal-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          /* Make editable inputs render as plain text in print */
          #proposal-document input,
          #proposal-document textarea {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            color: #0f172a !important;
            -webkit-appearance: none !important;
            appearance: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Invoice;
