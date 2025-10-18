import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calculator, TrendingUp, Calendar, Type, Search } from "lucide-react";

interface FormulaBuilderProps {
  onSelectFormula: (formula: string) => void;
}

const FORMULAS = {
  "Math & Statistics": [
    { name: "SUM", syntax: "=SUM(A1:A10)", desc: "Adds all numbers in a range" },
    { name: "AVERAGE", syntax: "=AVERAGE(A1:A10)", desc: "Returns the average of numbers" },
    { name: "COUNT", syntax: "=COUNT(A1:A10)", desc: "Counts cells containing numbers" },
    { name: "MIN", syntax: "=MIN(A1:A10)", desc: "Returns the smallest value" },
    { name: "MAX", syntax: "=MAX(A1:A10)", desc: "Returns the largest value" },
    { name: "ROUND", syntax: "=ROUND(A1,2)", desc: "Rounds a number to specified decimals" },
    { name: "ABS", syntax: "=ABS(A1)", desc: "Returns absolute value" },
    { name: "SQRT", syntax: "=SQRT(A1)", desc: "Returns square root" },
    { name: "POWER", syntax: "=POWER(A1,2)", desc: "Raises number to a power" },
  ],
  "Logical": [
    { name: "IF", syntax: "=IF(A1>10,'Yes','No')", desc: "Returns value based on condition" },
    { name: "AND", syntax: "=AND(A1>5,B1<10)", desc: "Returns TRUE if all conditions are true" },
    { name: "OR", syntax: "=OR(A1>5,B1<10)", desc: "Returns TRUE if any condition is true" },
    { name: "NOT", syntax: "=NOT(A1>5)", desc: "Reverses the logical value" },
  ],
  "Text": [
    { name: "CONCATENATE", syntax: "=CONCATENATE(A1,' ',B1)", desc: "Joins text strings" },
    { name: "LEFT", syntax: "=LEFT(A1,5)", desc: "Returns leftmost characters" },
    { name: "RIGHT", syntax: "=RIGHT(A1,5)", desc: "Returns rightmost characters" },
    { name: "LEN", syntax: "=LEN(A1)", desc: "Returns length of text" },
    { name: "UPPER", syntax: "=UPPER(A1)", desc: "Converts text to uppercase" },
    { name: "LOWER", syntax: "=LOWER(A1)", desc: "Converts text to lowercase" },
  ],
  "Date & Time": [
    { name: "TODAY", syntax: "=TODAY()", desc: "Returns current date" },
    { name: "NOW", syntax: "=NOW()", desc: "Returns current date and time" },
    { name: "YEAR", syntax: "=YEAR(A1)", desc: "Extracts year from date" },
    { name: "MONTH", syntax: "=MONTH(A1)", desc: "Extracts month from date" },
    { name: "DAY", syntax: "=DAY(A1)", desc: "Extracts day from date" },
  ],
};

const CATEGORY_ICONS: Record<string, any> = {
  "Math & Statistics": Calculator,
  "Logical": Search,
  "Text": Type,
  "Date & Time": Calendar,
};

export function FormulaBuilder({ onSelectFormula }: FormulaBuilderProps) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-3">Formula Library</h3>
      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {Object.entries(FORMULAS).map(([category, formulas]) => {
            const Icon = CATEGORY_ICONS[category] || Calculator;
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                  <Icon className="h-4 w-4" />
                  {category}
                </div>
                <div className="space-y-1">
                  {formulas.map((formula) => (
                    <Button
                      key={formula.name}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => onSelectFormula(formula.syntax)}
                    >
                      <div className="flex-1">
                        <div className="font-mono text-xs font-semibold">{formula.name}</div>
                        <div className="text-xs text-muted-foreground">{formula.desc}</div>
                        <div className="text-xs font-mono text-primary mt-1">{formula.syntax}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}