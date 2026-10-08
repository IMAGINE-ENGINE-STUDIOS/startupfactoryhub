import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Search, X, Plus, Minus, LayoutGrid, List, Star } from "lucide-react";

/* Edit this catalog (or ask the AI) to sell your own products. Checkout uses the project's real cart + payments. */
const STORE = { name: "Atelier Supply", currency: "USD", taxPct: 8, shipping: 6, freeShippingOver: 120 };
const PRODUCTS = [
  { id: "p1", name: "Linen Overshirt", category: "Apparel", price: 89, rating: 4.8, image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=70", blurb: "Washed European linen, relaxed fit." },
  { id: "p2", name: "Canvas Weekender", category: "Bags", price: 145, rating: 4.9, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=70", blurb: "Waxed canvas with leather trim." },
  { id: "p3", name: "Ceramic Pour-Over", category: "Home", price: 42, rating: 4.7, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=70", blurb: "Hand-glazed stoneware dripper." },
  { id: "p4", name: "Merino Beanie", category: "Apparel", price: 34, rating: 4.6, image: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800&q=70", blurb: "Soft, warm, itch-free merino." },
  { id: "p5", name: "Leather Card Wallet", category: "Bags", price: 58, rating: 4.8, image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=70", blurb: "Full-grain, ages beautifully." },
  { id: "p6", name: "Oak Desk Tray", category: "Home", price: 39, rating: 4.5, image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=70", blurb: "Solid oak, oiled finish." },
];

type Line = { id: string; name: string; price: number; image: string; qty: number };
const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: STORE.currency }).format(n);
const cartCmd = (cmd: string, args: any[] = []) => { try { parent.postMessage({ ie: "cart-cmd", cmd, args }, "*"); } catch {} };

function fuzzy(q: string, text: string) {
  q = q.toLowerCase().trim(); if (!q) return true;
  text = text.toLowerCase(); let i = 0;
  for (const ch of text) if (ch === q[i]) i++;
  return text.includes(q) || i === q.length;
}

export default function App() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(() => { try { return JSON.parse(localStorage.getItem("ie-store-cart") || "[]"); } catch { return []; } });
  const save = (l: Line[]) => { setLines(l); localStorage.setItem("ie-store-cart", JSON.stringify(l)); };

  const cats = ["All", ...Array.from(new Set(PRODUCTS.map((p) => p.category)))];
  const shown = useMemo(() => PRODUCTS.filter((p) => (cat === "All" || p.category === cat) && fuzzy(q, p.name + " " + p.blurb + " " + p.category)), [cat, q]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const ship = sub === 0 || sub >= STORE.freeShippingOver ? 0 : STORE.shipping;
  const tax = sub * STORE.taxPct / 100;

  const add = (p: typeof PRODUCTS[number]) => {
    const f = lines.find((l) => l.id === p.id);
    save(f ? lines.map((l) => (l.id === p.id ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { id: p.id, name: p.name, price: p.price, image: p.image, qty: 1 }]);
    (window as any).IE?.emit?.("addToCart", { id: p.id, price: p.price });
    setOpen(true);
  };
  const qty = (id: string, d: number) => save(lines.flatMap((l) => (l.id !== id ? [l] : l.qty + d <= 0 ? [] : [{ ...l, qty: l.qty + d }])));
  const checkout = () => {
    cartCmd("clear");
    cartCmd("setConfig", [{ taxPct: STORE.taxPct, shipping: ship }]);
    lines.forEach((l) => cartCmd("add", [{ name: l.name, price: l.price, image: l.image, qty: l.qty, source: "store" }]));
    cartCmd("checkout");
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-20 bg-stone-50/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">
          <div className="font-serif text-xl tracking-tight">{STORE.name}</div>
          <div className="flex-1 max-w-md mx-auto relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-stone-200 text-sm outline-none focus:border-stone-400" />
          </div>
          <button onClick={() => setOpen(true)} className="relative p-2 rounded-full hover:bg-stone-200" aria-label="Open cart">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-amber-700 text-white text-[11px] grid place-items-center">{count}</span>}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={"px-4 py-1.5 rounded-full text-sm border " + (cat === c ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 hover:border-stone-400")}>{c}</button>
          ))}
          <div className="ml-auto flex gap-1">
            <button onClick={() => setView("grid")} className={"p-2 rounded " + (view === "grid" ? "bg-stone-200" : "")} aria-label="Grid"><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView("list")} className={"p-2 rounded " + (view === "list" ? "bg-stone-200" : "")} aria-label="List"><List className="w-4 h-4" /></button>
          </div>
        </div>

        {shown.length === 0 && <p className="text-stone-500 py-16 text-center">No products match "{q}".</p>}
        <motion.div layout className={view === "grid" ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"}>
          {shown.map((p) => (
            <motion.article layout key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={"bg-white rounded-2xl border border-stone-200 overflow-hidden " + (view === "list" ? "flex" : "")}>
              <img src={p.image} alt={p.name} className={view === "list" ? "w-40 h-40 object-cover" : "w-full aspect-[4/3] object-cover"} />
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between text-xs text-stone-500"><span>{p.category}</span><span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-500 text-amber-500" />{p.rating}</span></div>
                <h3 className="font-medium">{p.name}</h3>
                <p className="text-sm text-stone-500">{p.blurb}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-semibold">{money(p.price)}</span>
                  <button onClick={() => add(p)} className="px-4 py-2 rounded-full bg-stone-900 text-white text-sm hover:bg-amber-800">Add to cart</button>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </main>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 bg-black/30 z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside className="fixed right-0 top-0 h-full w-full max-w-sm bg-white z-40 flex flex-col shadow-2xl" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}>
              <div className="h-16 px-5 flex items-center justify-between border-b border-stone-200">
                <h2 className="font-serif text-lg">Your cart</h2>
                <button onClick={() => setOpen(false)} aria-label="Close"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
                {lines.length === 0 && <p className="text-stone-500 text-sm">Your cart is empty.</p>}
                {lines.map((l) => (
                  <div key={l.id} className="flex gap-3 items-center">
                    <img src={l.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1"><div className="text-sm font-medium">{l.name}</div><div className="text-xs text-stone-500">{money(l.price)}</div></div>
                    <div className="flex items-center gap-2 border border-stone-200 rounded-full px-2 py-1">
                      <button onClick={() => qty(l.id, -1)} aria-label="Less"><Minus className="w-3 h-3" /></button>
                      <span className="text-sm w-4 text-center">{l.qty}</span>
                      <button onClick={() => qty(l.id, 1)} aria-label="More"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-200 p-5 text-sm flex flex-col gap-1.5">
                <div className="flex justify-between"><span>Subtotal</span><span>{money(sub)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{ship ? money(ship) : "Free"}</span></div>
                <div className="flex justify-between"><span>Tax ({STORE.taxPct}%)</span><span>{money(tax)}</span></div>
                <div className="flex justify-between font-semibold text-base pt-1"><span>Total</span><span>{money(sub + ship + tax)}</span></div>
                <button disabled={!lines.length} onClick={checkout} className="mt-3 py-3 rounded-full bg-amber-800 text-white disabled:opacity-40">Secure checkout</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
