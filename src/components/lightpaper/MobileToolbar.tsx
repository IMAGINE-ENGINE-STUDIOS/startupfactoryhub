import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ToolbarAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "ghost" | "outline";
  disabled?: boolean;
  priority?: "high" | "medium" | "low";
}

interface ToolbarGroup {
  label: string;
  actions: ToolbarAction[];
}

interface MobileToolbarProps {
  groups: ToolbarGroup[];
  rightActions?: ToolbarAction[];
}

export function MobileToolbar({ groups, rightActions = [] }: MobileToolbarProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Desktop view - show all actions
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 flex-wrap">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-0.5">
              {groupIdx > 0 && <div className="w-px h-6 bg-border mx-1" />}
              {group.actions.map((action, actionIdx) => (
                <Button
                  key={actionIdx}
                  variant={action.variant || "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          ))}
        </div>
        {rightActions.length > 0 && (
          <div className="flex items-center gap-0.5">
            {rightActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.label}
              >
                <action.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mobile view - every action collapsed into ONE dropdown to save vertical space
  const totalActions = groups.reduce((sum, g) => sum + g.actions.length, 0);

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs flex-shrink-0">
            <MoreHorizontal className="h-4 w-4" />
            Tools
            <span className="text-[10px] opacity-60 tabular-nums">{totalActions}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-background backdrop-blur-none z-[60] p-0">
          <ScrollArea className="h-[60vh]">
            <div className="p-1">
              {groups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  {groupIdx > 0 && <DropdownMenuSeparator />}
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-4 gap-1 px-1 pb-1">
                    {group.actions.map((action, actionIdx) => (
                      <DropdownMenuItem
                        key={actionIdx}
                        onSelect={() => { action.onClick(); }}
                        disabled={action.disabled}
                        className="flex flex-col items-center justify-center gap-1 h-14 rounded-lg text-center cursor-pointer"
                      >
                        <action.icon className="h-4 w-4" />
                        <span className="text-[9px] leading-tight line-clamp-2">{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      {rightActions.length > 0 && (
        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
          {rightActions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

