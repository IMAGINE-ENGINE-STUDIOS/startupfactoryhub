/* Built-in UI kit for Imagine Engine live apps: served for "@/components/ui/*" and "@/lib/utils"
   when the Dev tab has no file at that path. Sources are TSX compiled by liveapp.html. */
window.__IE_UI = {
  "lib/utils": `export function cn(...a: any[]) { return a.flat(Infinity as any).filter(Boolean).join(" "); }`,
  "components/ui/button": `import { cn } from "@/lib/utils";
const V: Record<string,string> = { default: "bg-blue-600 text-white hover:bg-blue-500", secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700", outline: "border border-zinc-700 text-zinc-100 hover:bg-zinc-800", ghost: "text-zinc-200 hover:bg-zinc-800", destructive: "bg-red-600 text-white hover:bg-red-500" };
const S: Record<string,string> = { sm: "h-8 px-3 text-xs", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base", icon: "h-10 w-10" };
export function Button({ variant = "default", size = "md", className, ...p }: any) {
  return <button className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", V[variant] || V.default, S[size] || S.md, className)} {...p} />;
}
export default Button;`,
  "components/ui/card": `import { cn } from "@/lib/utils";
export const Card = ({ className, ...p }: any) => <div className={cn("rounded-2xl border border-zinc-800 bg-zinc-900/70 backdrop-blur text-zinc-100 shadow-sm", className)} {...p} />;
export const CardHeader = ({ className, ...p }: any) => <div className={cn("p-5 pb-2 space-y-1", className)} {...p} />;
export const CardTitle = ({ className, ...p }: any) => <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...p} />;
export const CardDescription = ({ className, ...p }: any) => <p className={cn("text-sm text-zinc-400", className)} {...p} />;
export const CardContent = ({ className, ...p }: any) => <div className={cn("p-5 pt-2", className)} {...p} />;
export const CardFooter = ({ className, ...p }: any) => <div className={cn("p-5 pt-0 flex items-center gap-2", className)} {...p} />;
export default Card;`,
  "components/ui/input": `import { cn } from "@/lib/utils";
const base = "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
export const Input = ({ className, ...p }: any) => <input className={cn(base, "h-10", className)} {...p} />;
export const Textarea = ({ className, ...p }: any) => <textarea className={cn(base, "py-2 min-h-[90px]", className)} {...p} />;
export const Label = ({ className, ...p }: any) => <label className={cn("text-xs font-medium text-zinc-400", className)} {...p} />;
export default Input;`,
  "components/ui/badge": `import { cn } from "@/lib/utils";
const V: Record<string,string> = { default: "bg-blue-500/15 text-blue-300", success: "bg-emerald-500/15 text-emerald-300", warning: "bg-amber-500/15 text-amber-300", danger: "bg-red-500/15 text-red-300", outline: "border border-zinc-700 text-zinc-300" };
export function Badge({ variant = "default", className, ...p }: any) { return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", V[variant] || V.default, className)} {...p} />; }
export default Badge;`,
  "components/ui/dialog": `import { cn } from "@/lib/utils";
export function Dialog({ open, onOpenChange, title, description, children, className }: any) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => onOpenChange && onOpenChange(false)}>
    <div role="dialog" className={cn("w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100 shadow-2xl", className)} onClick={(e) => e.stopPropagation()}>
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </div>
  </div>;
}
export default Dialog;`,
  "components/ui/tabs": `import { cn } from "@/lib/utils";
export function Tabs({ tabs = [], value, onChange, className }: any) {
  return <div className={cn("inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1", className)}>
    {tabs.map((t: any) => <button key={t.value} onClick={() => onChange && onChange(t.value)} className={cn("rounded-lg px-3 py-1.5 text-sm transition-colors", value === t.value ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-100")}>{t.label}</button>)}
  </div>;
}
export default Tabs;`,
  "components/ui/table": `import { cn } from "@/lib/utils";
export const Table = ({ className, ...p }: any) => <div className="w-full overflow-x-auto rounded-2xl border border-zinc-800"><table className={cn("w-full text-sm", className)} {...p} /></div>;
export const THead = ({ className, ...p }: any) => <thead className={cn("bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-400", className)} {...p} />;
export const TBody = ({ className, ...p }: any) => <tbody className={cn("divide-y divide-zinc-800", className)} {...p} />;
export const TR = ({ className, ...p }: any) => <tr className={cn("hover:bg-zinc-900/60", className)} {...p} />;
export const TH = ({ className, ...p }: any) => <th className={cn("px-4 py-3 font-medium", className)} {...p} />;
export const TD = ({ className, ...p }: any) => <td className={cn("px-4 py-3 text-zinc-200", className)} {...p} />;
export default Table;`,
  "components/ui/switch": `import { cn } from "@/lib/utils";
export function Switch({ checked, onCheckedChange, className, ...p }: any) {
  return <button role="switch" aria-checked={!!checked} onClick={() => onCheckedChange && onCheckedChange(!checked)} className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-blue-600" : "bg-zinc-700", className)} {...p}><span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all", checked ? "left-[22px]" : "left-0.5")} /></button>;
}
export default Switch;`,
  "components/ui/checkbox": `import { cn } from "@/lib/utils";
export function Checkbox({ checked, onCheckedChange, className, ...p }: any) { return <input type="checkbox" checked={!!checked} onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)} className={cn("h-4 w-4 accent-blue-600", className)} {...p} />; }
export default Checkbox;`,
  "components/ui/slider": `import { cn } from "@/lib/utils";
export function Slider({ value = [0], onValueChange, min = 0, max = 100, step = 1, className }: any) {
  const v = Array.isArray(value) ? value[0] : value;
  return <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => onValueChange && onValueChange([+e.target.value])} className={cn("w-full accent-blue-600", className)} />;
}
export default Slider;`,
  "components/ui/select": `import { cn } from "@/lib/utils";
export function Select({ value, onValueChange, options = [], placeholder, className }: any) {
  return <select value={value ?? ""} onChange={(e) => onValueChange && onValueChange(e.target.value)} className={cn("h-10 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100", className)}>
    {placeholder && <option value="" disabled>{placeholder}</option>}
    {options.map((o: any) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>;
}
export default Select;`,
  "components/ui/progress": `import { cn } from "@/lib/utils";
export function Progress({ value = 0, className }: any) { return <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-800", className)}><div className="h-full bg-blue-600 transition-all" style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></div>; }
export default Progress;`,
  "components/ui/avatar": `import { cn } from "@/lib/utils";
export function Avatar({ src, name = "", className }: any) {
  const ini = String(name).split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
  return <div className={cn("flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-zinc-800 text-sm font-medium text-zinc-200", className)}>{src ? <img src={src} alt={name} className="h-full w-full object-cover" /> : ini}</div>;
}
export default Avatar;`,
  "components/ui/skeleton": `import { cn } from "@/lib/utils";
export const Skeleton = ({ className, ...p }: any) => <div className={cn("animate-pulse rounded-xl bg-zinc-800", className)} {...p} />;
export default Skeleton;`,
  "components/ui/separator": `import { cn } from "@/lib/utils";
export const Separator = ({ vertical, className }: any) => <div className={cn(vertical ? "h-full w-px" : "h-px w-full", "bg-zinc-800", className)} />;
export default Separator;`,
  "components/ui/alert": `import { cn } from "@/lib/utils";
const V: Record<string,string> = { default: "border-zinc-700 bg-zinc-900", success: "border-emerald-700/50 bg-emerald-500/10", warning: "border-amber-700/50 bg-amber-500/10", destructive: "border-red-700/50 bg-red-500/10" };
export function Alert({ variant = "default", title, children, className }: any) { return <div role="alert" className={cn("rounded-xl border p-4 text-sm text-zinc-100", V[variant] || V.default, className)}>{title && <div className="mb-1 font-semibold">{title}</div>}<div className="text-zinc-300">{children}</div></div>; }
export default Alert;`,
  "components/ui/accordion": `import { useState } from "react";
import { cn } from "@/lib/utils";
export function Accordion({ items = [], className }: any) {
  const [open, setOpen] = useState(-1);
  return <div className={cn("divide-y divide-zinc-800 rounded-2xl border border-zinc-800", className)}>{items.map((it: any, i: number) => <div key={i}>
    <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-100">{it.title}<span className={cn("transition-transform", open === i && "rotate-180")}>v</span></button>
    {open === i && <div className="px-4 pb-4 text-sm text-zinc-400">{it.content}</div>}
  </div>)}</div>;
}
export default Accordion;`,
  "components/ui/tooltip": `import { useState } from "react";
export function Tooltip({ content, children }: any) {
  const [s, setS] = useState(false);
  return <span className="relative inline-flex" onMouseEnter={() => setS(true)} onMouseLeave={() => setS(false)}>{children}{s && <span className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-100 shadow">{content}</span>}</span>;
}
export default Tooltip;`,
  "components/ui/sheet": `import { cn } from "@/lib/utils";
export function Sheet({ open, onOpenChange, side = "right", title, children, className }: any) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-black/60" onClick={() => onOpenChange && onOpenChange(false)}>
    <div onClick={(e) => e.stopPropagation()} className={cn("absolute top-0 h-full w-80 max-w-[90vw] overflow-y-auto border-zinc-800 bg-zinc-900 p-6 text-zinc-100", side === "left" ? "left-0 border-r" : "right-0 border-l", className)}>{title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}{children}</div>
  </div>;
}
export default Sheet;`,
  "components/ui/dropdown-menu": `import { useState } from "react";
export function DropdownMenu({ trigger, items = [] }: any) {
  const [o, setO] = useState(false);
  return <div className="relative inline-block"><span onClick={() => setO(!o)}>{trigger}</span>{o && <div className="absolute right-0 z-50 mt-2 min-w-[10rem] rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-xl">{items.map((it: any, i: number) => <button key={i} onClick={() => { setO(false); it.onSelect && it.onSelect(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800">{it.label}</button>)}</div>}</div>;
}
export default DropdownMenu;`,
  "components/ui/toast": `import { useEffect, useState } from "react";
const subs: any[] = [];
export function toast(msg: string, opts: any = {}) { subs.forEach((f) => f({ id: Date.now() + Math.random(), msg, ...opts })); }
export function Toaster() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { const f = (t: any) => { setList((l) => [...l, t]); setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), t.duration || 3000); }; subs.push(f); return () => { subs.splice(subs.indexOf(f), 1); }; }, []);
  return <div className="fixed bottom-4 right-4 z-[100] space-y-2">{list.map((t) => <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 shadow-xl">{t.msg}</div>)}</div>;
}
export default Toaster;`,
};
