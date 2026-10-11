import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ShoppingBag, Search } from 'lucide-react';

const db = supabase as any;
const money = (c: number, cur = 'usd') => (c / 100).toLocaleString(undefined, { style: 'currency', currency: cur.toUpperCase() });

/** Admin view of every profile-shop sale, grouped by seller. */
export default function ProfileSalesManagement() {
  const [sales, setSales] = useState<any[]>([]);
  const [people, setPeople] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await db.from('profile_sales').select('*').order('created_at', { ascending: false }).limit(1000);
      const rows = data || [];
      setSales(rows);
      const ids = [...new Set(rows.flatMap((r: any) => [r.seller_id, r.buyer_id]).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: p } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', ids);
        setPeople(Object.fromEntries((p || []).map((x: any) => [x.user_id, x])));
      }
      setLoading(false);
    })();
  }, []);

  const bySeller = useMemo(() => {
    const m: Record<string, { gross: number; fee: number; count: number }> = {};
    sales.forEach(s => {
      m[s.seller_id] ||= { gross: 0, fee: 0, count: 0 };
      m[s.seller_id].gross += s.amount_cents; m[s.seller_id].fee += s.platform_fee_cents; m[s.seller_id].count++;
    });
    return Object.entries(m)
      .filter(([id]) => !q || (people[id]?.full_name || '').toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b[1].gross - a[1].gross);
  }, [sales, people, q]);

  const total = sales.reduce((a, s) => a + s.amount_cents, 0);
  const fees = sales.reduce((a, s) => a + s.platform_fee_cents, 0);
  const list = seller ? sales.filter(s => s.seller_id === seller) : sales;

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        {[['Gross sales', money(total)], ['Platform fees', money(fees)], ['Owed to sellers', money(total - fees)], ['Orders', String(sales.length)]].map(([l, v]) => (
          <Card key={l} className="tech-card border-0"><CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{l}</p><p className="text-xl font-semibold">{v}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="tech-card border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Sellers</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search seller" className="h-8 pl-8 text-xs" />
            </div>
            <button onClick={() => setSeller(null)} className={`w-full rounded-md px-2 py-1.5 text-left text-xs ${!seller ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}>All sellers</button>
            {bySeller.map(([id, t]) => (
              <button key={id} onClick={() => setSeller(id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${seller === id ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                <Avatar className="h-7 w-7"><AvatarImage src={people[id]?.avatar_url} /><AvatarFallback className="text-[10px]">{(people[id]?.full_name || '?')[0]}</AvatarFallback></Avatar>
                <span className="flex-1 truncate text-xs">{people[id]?.full_name || 'Unknown'}</span>
                <span className="text-xs font-medium">{money(t.gross)}</span>
              </button>
            ))}
            {bySeller.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No sales yet.</p>}
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShoppingBag className="h-4 w-4" />Orders</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground"><tr className="text-left">
                <th className="py-2 pr-3">Date</th><th className="pr-3">Item</th><th className="pr-3">Seller</th><th className="pr-3">Buyer</th>
                <th className="pr-3 text-right">Amount</th><th className="pr-3 text-right">Fee</th><th className="text-right">Seller net</th>
              </tr></thead>
              <tbody>
                {list.map(s => (
                  <tr key={s.id} className="border-t border-border/40">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="pr-3">{s.listing_title}{s.quantity > 1 ? ` x${s.quantity}` : ''}</td>
                    <td className="pr-3">{people[s.seller_id]?.full_name || '—'}</td>
                    <td className="pr-3">{people[s.buyer_id]?.full_name || s.buyer_email || 'Guest'}</td>
                    <td className="pr-3 text-right">{money(s.amount_cents, s.currency)}</td>
                    <td className="pr-3 text-right">{money(s.platform_fee_cents, s.currency)}</td>
                    <td className="text-right">{money(s.amount_cents - s.platform_fee_cents, s.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">No orders.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
