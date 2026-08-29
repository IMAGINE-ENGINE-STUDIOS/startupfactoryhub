import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Trash2,
  Search,
  Loader2,
  Send,
  Link2,
  Users,
  RefreshCw,
} from "lucide-react";
import { INVOICE_CATALOG, CATALOG_GROUPS, type InvoiceBilling as Billing } from "@/lib/invoice-catalog";

interface ProfileRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  billing: Billing;
}

const billingLabel: Record<Billing, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  yearly: "Yearly",
};

const generateInvoiceNumber = () => {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `INV-${stamp}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const money = (n: number, cur: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(n || 0);

const InvoiceBilling = () => {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, ProfileRow>>({});
  const [manualEmail, setManualEmail] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  const [paymentLinkUrl, setPaymentLinkUrl] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchProfiles = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email")
      .order("full_name", { ascending: true })
      .limit(1000);
    if (error) toast.error("Failed to load users: " + error.message);
    setProfiles((data || []) as ProfileRow[]);
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = profiles.filter((p) => p.email);
    if (!q) return list.slice(0, 60);
    return list
      .filter((p) => p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q))
      .slice(0, 60);
  }, [profiles, search]);

  const recipients = Object.values(selected);

  const toggleUser = (p: ProfileRow) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.user_id]) delete next[p.user_id];
      else next[p.user_id] = p;
      return next;
    });
  };

  const addManual = () => {
    const email = manualEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setSelected((prev) => ({
      ...prev,
      [email]: { user_id: email, full_name: null, email },
    }));
    setManualEmail("");
  };

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = { ...prev };
      filteredProfiles.forEach((p) => (next[p.user_id] = p));
      return next;
    });
  };

  const addCatalogItem = (id: string) => {
    const c = INVOICE_CATALOG.find((x) => x.id === id);
    if (!c) return;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        description: c.description,
        quantity: 1,
        unit_price: c.unit_price,
        billing: c.billing,
      },
    ]);
  };

  const addBlankItem = () =>
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, billing: "one_time" },
    ]);

  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = ((subtotal - discount) * taxRate) / 100;
  const total = Math.max(0, subtotal - discount + taxAmount);

  const totalsByBilling = useMemo(() => {
    const t = { one_time: 0, monthly: 0, yearly: 0 } as Record<Billing, number>;
    items.forEach((i) => (t[i.billing] += i.quantity * i.unit_price));
    return t;
  }, [items]);

  const createPaymentLink = async () => {
    if (total <= 0) {
      toast.error("Add at least one item first");
      return;
    }
    if (totalsByBilling.monthly > 0 && totalsByBilling.yearly > 0) {
      toast.error("Payment links support only one recurring interval (monthly OR yearly)");
      return;
    }
    setCreatingLink(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-proposal-payment-link", {
        body: {
          proposalNumber: invoiceNumber,
          currency,
          oneTimeAmount: Math.round((totalsByBilling.one_time - discount + taxAmount) * 100),
          monthlyAmount: Math.round(totalsByBilling.monthly * 100),
          yearlyAmount: Math.round(totalsByBilling.yearly * 100),
          clientName: recipients.length === 1 ? recipients[0].full_name || recipients[0].email : "Startup Factory Hub member",
          clientEmail: recipients.length === 1 ? recipients[0].email : undefined,
        },
      });
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("No payment link returned");
      setPaymentLinkUrl(url);
      toast.success("Stripe payment link created");
    } catch (e: any) {
      toast.error("Payment link failed: " + (e?.message || "unknown error"));
    } finally {
      setCreatingLink(false);
    }
  };

  const sendInvoices = async () => {
    if (recipients.length === 0) {
      toast.error("Select at least one recipient");
      return;
    }
    if (items.filter((i) => i.description.trim()).length === 0) {
      toast.error("Add at least one invoice item");
      return;
    }
    setSending(true);
    try {
      const payloadItems = items
        .filter((i) => i.description.trim())
        .map(({ description, quantity, unit_price, billing }) => ({ description, quantity, unit_price, billing }));

      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoiceNumber,
          issueDate,
          dueDate: dueDate || undefined,
          currency,
          items: payloadItems,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          total,
          notes,
          paymentLinkUrl: paymentLinkUrl || undefined,
          recipients: recipients.map((r) => ({ email: r.email!, name: r.full_name || undefined })),
        },
      });
      if (error) throw error;

      // Persist one record per recipient
      const { data: authData } = await supabase.auth.getUser();
      const rows = recipients.map((r, idx) => ({
        proposal_number: recipients.length > 1 ? `${invoiceNumber}-${idx + 1}` : invoiceNumber,
        title: "Invoice",
        client_name: r.full_name || r.email || "Member",
        client_email: r.email,
        currency,
        issue_date: issueDate,
        valid_until: dueDate || null,
        items: payloadItems as any,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount,
        total,
        notes: notes || null,
        status: "sent",
        created_by: authData.user?.id ?? null,
      }));
      const { error: dbError } = await supabase.from("proposals").insert(rows);
      if (dbError) console.error("invoice persist failed", dbError);

      const sent = (data as any)?.sent ?? recipients.length;
      const failed = (data as any)?.failed ?? 0;
      toast.success(`Invoice sent to ${sent} recipient${sent === 1 ? "" : "s"}${failed ? ` · ${failed} failed` : ""}`);
      setInvoiceNumber(generateInvoiceNumber());
    } catch (e: any) {
      toast.error("Send failed: " + (e?.message || "unknown error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Invoice Billing
          </CardTitle>
          <Badge variant="secondary">{recipients.length} recipient{recipients.length === 1 ? "" : "s"}</Badge>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Left: invoice builder */}
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice #</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Issue date</Label>
                <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-background backdrop-blur-none">
                    <SelectItem value="usd">USD</SelectItem>
                    <SelectItem value="eur">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Add from catalog</Label>
              <Select value="" onValueChange={addCatalogItem}>
                <SelectTrigger><SelectValue placeholder="Subscriptions & accelerator programs" /></SelectTrigger>
                <SelectContent className="bg-background backdrop-blur-none">
                  {CATALOG_GROUPS.map((g) => (
                    <div key={g}>
                      <div className="px-2 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">{g}</div>
                      {INVOICE_CATALOG.filter((c) => c.group === g).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.label} — {money(c.unit_price, currency)}
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              {items.map((i) => (
                <div key={i.id} className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-12">
                  <div className="sm:col-span-5 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Description</Label>
                    <Textarea
                      rows={2}
                      value={i.description}
                      onChange={(e) => updateItem(i.id, { description: e.target.value })}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Billing</Label>
                    <Select value={i.billing} onValueChange={(v) => updateItem(i.id, { billing: v as Billing })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-background backdrop-blur-none">
                        {(Object.keys(billingLabel) as Billing[]).map((b) => (
                          <SelectItem key={b} value={b}>{billingLabel[b]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Qty</Label>
                    <Input
                      type="number"
                      min={1}
                      value={i.quantity}
                      onChange={(e) => updateItem(i.id, { quantity: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Unit price</Label>
                    <Input
                      type="number"
                      min={0}
                      value={i.unit_price}
                      onChange={(e) => updateItem(i.id, { unit_price: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-end justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(i.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addBlankItem}>
                <Plus className="mr-2 h-4 w-4" /> Add custom line
              </Button>
            </div>

            <Separator />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Discount ({currency.toUpperCase()})</Label>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tax rate (%)</Label>
                <Input type="number" min={0} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Note to recipients</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional message included in the invoice email" />
            </div>

            <div className="rounded-lg border border-border/50 p-4 text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{money(subtotal, currency)}</span></div>
              {discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span>-{money(discount, currency)}</span></div>}
              {taxRate > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span>{money(taxAmount, currency)}</span></div>}
              <div className="flex justify-between font-semibold text-foreground pt-1"><span>Amount due</span><span>{money(total, currency)}</span></div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={createPaymentLink} disabled={creatingLink}>
                {creatingLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                {paymentLinkUrl ? "Regenerate payment link" : "Create Stripe payment link"}
              </Button>
              <Button onClick={sendInvoices} disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Send invoice{recipients.length > 1 ? ` to ${recipients.length} users` : ""}
              </Button>
            </div>
            {paymentLinkUrl && (
              <p className="text-xs text-muted-foreground break-all">Payment link: {paymentLinkUrl}</p>
            )}
          </div>

          {/* Right: recipients */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs"><Users className="h-4 w-4" /> Recipients</Label>
              <Button variant="ghost" size="icon" onClick={fetchProfiles} disabled={loadingUsers}>
                <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search users by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllFiltered}>Select listed</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected({})}>Clear</Button>
            </div>

            <ScrollArea className="h-72 rounded-lg border border-border/50">
              <div className="p-2 space-y-1">
                {loadingUsers && <p className="p-3 text-sm text-muted-foreground">Loading users…</p>}
                {!loadingUsers && filteredProfiles.length === 0 && (
                  <p className="p-3 text-sm text-muted-foreground">No users found.</p>
                )}
                {filteredProfiles.map((p) => (
                  <label key={p.user_id} className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-white/[0.05]">
                    <Checkbox checked={!!selected[p.user_id]} onCheckedChange={() => toggleUser(p)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{p.full_name || "Unnamed"}</span>
                      <span className="block truncate text-xs text-muted-foreground">{p.email}</span>
                    </span>
                  </label>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Add external email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
              />
              <Button variant="outline" onClick={addManual}><Plus className="h-4 w-4" /></Button>
            </div>

            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {recipients.map((r) => (
                  <Badge key={r.user_id} variant="secondary" className="cursor-pointer" onClick={() => toggleUser(r)}>
                    {r.email}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceBilling;
