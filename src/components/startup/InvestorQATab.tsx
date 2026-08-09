import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { INVESTOR_QUESTION_SECTIONS, TOTAL_INVESTOR_QUESTIONS } from '@/lib/investorQuestions';

interface InvestorQATabProps {
  companyId: string;
  /** When true the founder can edit and autosave answers. */
  editable?: boolean;
}

type Answers = Record<string, string>;

export default function InvestorQATab({ companyId, editable = false }: InvestorQATabProps) {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_investor_qa')
        .select('question_key, answer')
        .eq('company_id', companyId);
      if (!active) return;
      if (error) {
        toast({ title: 'Error', description: 'Could not load investor Q&A.', variant: 'destructive' });
      } else {
        const map: Answers = {};
        (data || []).forEach((row: any) => {
          map[row.question_key] = row.answer || '';
        });
        setAnswers(map);
      }
      setLoading(false);
    };
    if (companyId) load();
    return () => {
      active = false;
    };
  }, [companyId, toast]);

  // Clear pending debounce timers on unmount
  useEffect(() => {
    const pending = timers.current;
    return () => {
      Object.values(pending).forEach(clearTimeout);
    };
  }, []);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v && v.trim().length > 0).length,
    [answers]
  );

  const persist = async (questionKey: string, value: string) => {
    setSavingKey(questionKey);
    const { error } = await supabase
      .from('company_investor_qa')
      .upsert(
        { company_id: companyId, question_key: questionKey, answer: value },
        { onConflict: 'company_id,question_key' }
      );
    setSavingKey(null);
    if (error) {
      toast({ title: 'Error', description: 'Could not save your answer.', variant: 'destructive' });
      return;
    }
    setSavedKey(questionKey);
    setTimeout(() => setSavedKey((k) => (k === questionKey ? null : k)), 1500);
  };

  const handleChange = (questionKey: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));
    if (timers.current[questionKey]) clearTimeout(timers.current[questionKey]);
    timers.current[questionKey] = setTimeout(() => persist(questionKey, value), 900);
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin" />
          Loading investor Q&A…
        </CardContent>
      </Card>
    );
  }

  const visibleSections = editable
    ? INVESTOR_QUESTION_SECTIONS
    : INVESTOR_QUESTION_SECTIONS.map((s) => ({
        ...s,
        questions: s.questions.filter((q) => (answers[q.key] || '').trim().length > 0),
      })).filter((s) => s.questions.length > 0);

  if (!editable && visibleSections.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="py-12 text-center text-muted-foreground">
          <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>This startup hasn't answered the investor questions yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {editable && (
        <Card className="tech-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" /> Investor Q&A
              </span>
              <Badge variant="secondary" className="text-[11px]">
                {answeredCount} / {TOTAL_INVESTOR_QUESTIONS} answered
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={(answeredCount / TOTAL_INVESTOR_QUESTIONS) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Answers save automatically and are visible to investors on your profile.
            </p>
          </CardContent>
        </Card>
      )}

      <Accordion type="multiple" defaultValue={[visibleSections[0]?.key]} className="space-y-3">
        {visibleSections.map((section) => {
          const Icon = section.icon;
          const sectionAnswered = section.questions.filter(
            (q) => (answers[q.key] || '').trim().length > 0
          ).length;
          return (
            <AccordionItem
              key={section.key}
              value={section.key}
              className="tech-card border-0 rounded-2xl px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <span className="flex items-center gap-3 text-left">
                  <span className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <span className="font-semibold text-sm">{section.title}</span>
                  {editable && (
                    <Badge variant="outline" className="text-[10px]">
                      {sectionAnswered}/{section.questions.length}
                    </Badge>
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                {section.questions.map((q) => {
                  const value = answers[q.key] || '';
                  return (
                    <div key={q.key} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{q.question}</p>
                        {editable && savingKey === q.key && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        {editable && savedKey === q.key && (
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                      </div>
                      {editable ? (
                        <Textarea
                          value={value}
                          onChange={(e) => handleChange(q.key, e.target.value)}
                          placeholder="Write your answer…"
                          rows={3}
                          className="resize-y"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{value}</p>
                      )}
                      {editable && !value.trim() && (
                        <p className="text-[11px] text-muted-foreground/70">Not answered yet</p>
                      )}
                    </div>
                  );
                })}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
