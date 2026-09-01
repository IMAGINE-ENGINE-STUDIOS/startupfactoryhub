import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, Rocket, GraduationCap, Briefcase, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { REFERRAL_PROGRAMS, type ReferralProgramId } from "@/lib/referral-programs";

const ICONS: Record<ReferralProgramId, any> = {
  mvp_program: Rocket,
  mentor: GraduationCap,
  advisor: Briefcase,
  subscription: Link2,
};

interface Props {
  referralCode: string;
}

export default function ProgramReferralLinks({ referralCode }: Props) {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(id);
    toast({ title: "Program link copied", description: "Share it to start earning on this program." });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Program Referral Links
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Every link below carries your unique code <span className="font-mono text-foreground">{referralCode}</span>,
          so each application and signup is attributed to you.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {REFERRAL_PROGRAMS.map((program) => {
          const Icon = ICONS[program.id];
          const url = program.buildUrl(referralCode);
          return (
            <div
              key={program.id}
              className="flex flex-col gap-3 rounded-xl bg-muted/30 p-4 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{program.name}</p>
                    <Badge variant="secondary" className="text-[11px]">
                      {program.commissionLabel}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">{program.programValueLabel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{program.description}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{url}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => copy(program.id, url)}>
                  {copied === program.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="sm" asChild aria-label={`Open ${program.name} link`}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
