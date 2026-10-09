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
};
