import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, Delete, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertResult?: (value: string) => void;
}

export function ScientificCalculator({ isOpen, onClose, onInsertResult }: CalculatorProps) {
  const [display, setDisplay] = useState("0");
  const [memory, setMemory] = useState(0);
  const [angleMode, setAngleMode] = useState<"deg" | "rad">("deg");
  const [history, setHistory] = useState<string[]>([]);

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumber(e.key);
      }
      // Operators
      else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      }
      else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      }
      else if (e.key === '*') {
        e.preventDefault();
        handleOperator('×');
      }
      else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      }
      else if (e.key === '.') {
        e.preventDefault();
        handleNumber('.');
      }
      // Calculate
      else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
      }
      // Clear
      else if (e.key === 'Escape') {
        e.preventDefault();
        clear();
      }
      // Backspace
      else if (e.key === 'Backspace') {
        e.preventDefault();
        clearEntry();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, display]);

  const handleNumber = (num: string) => {
    setDisplay(display === "0" ? num : display + num);
  };

  const handleOperator = (op: string) => {
    setDisplay(display + " " + op + " ");
  };

  const handleFunction = (func: string) => {
    try {
      const value = parseFloat(display);
      let result = 0;

      switch (func) {
        case "sin":
          result = angleMode === "deg" ? Math.sin((value * Math.PI) / 180) : Math.sin(value);
          break;
        case "cos":
          result = angleMode === "deg" ? Math.cos((value * Math.PI) / 180) : Math.cos(value);
          break;
        case "tan":
          result = angleMode === "deg" ? Math.tan((value * Math.PI) / 180) : Math.tan(value);
          break;
        case "log":
          result = Math.log10(value);
          break;
        case "ln":
          result = Math.log(value);
          break;
        case "sqrt":
          result = Math.sqrt(value);
          break;
        case "square":
          result = value * value;
          break;
        case "cube":
          result = value * value * value;
          break;
        case "exp":
          result = Math.exp(value);
          break;
        case "abs":
          result = Math.abs(value);
          break;
        case "1/x":
          result = 1 / value;
          break;
      }

      setDisplay(result.toString());
      addToHistory(`${func}(${value}) = ${result}`);
    } catch {
      setDisplay("Error");
    }
  };

  const handleConstant = (constant: string) => {
    const value = constant === "π" ? Math.PI : Math.E;
    setDisplay(value.toString());
  };

  const calculate = () => {
    try {
      // Replace × and ÷ with * and /
      const expression = display.replace(/×/g, "*").replace(/÷/g, "/");
      const result = eval(expression);
      addToHistory(`${display} = ${result}`);
      setDisplay(result.toString());
    } catch {
      setDisplay("Error");
    }
  };

  const clear = () => setDisplay("0");
  
  const clearEntry = () => {
    const parts = display.split(" ");
    parts.pop();
    setDisplay(parts.join(" ") || "0");
  };

  const addToHistory = (entry: string) => {
    setHistory([entry, ...history].slice(0, 10));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(display);
    toast.success("Copied to clipboard!");
  };

  const insertResult = () => {
    if (onInsertResult) {
      onInsertResult(display);
      toast.success("Result inserted!");
    }
  };

  // Memory functions
  const memoryAdd = () => setMemory(memory + parseFloat(display));
  const memorySubtract = () => setMemory(memory - parseFloat(display));
  const memoryRecall = () => setDisplay(memory.toString());
  const memoryClear = () => setMemory(0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scientific Calculator</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Display */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="text-right text-3xl font-mono break-all">{display}</div>
            <div className="text-right text-xs text-muted-foreground mt-1">
              Memory: {memory} | Mode: {angleMode.toUpperCase()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            {onInsertResult && (
              <Button variant="outline" size="sm" onClick={insertResult}>
                Insert Result
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setAngleMode(angleMode === "deg" ? "rad" : "deg")}>
              {angleMode === "deg" ? "DEG" : "RAD"}
            </Button>
          </div>

          {/* Calculator Buttons */}
          <div className="grid grid-cols-5 gap-2">
            {/* Row 1: Memory & Mode */}
            <Button variant="outline" onClick={memoryClear}>MC</Button>
            <Button variant="outline" onClick={memoryRecall}>MR</Button>
            <Button variant="outline" onClick={memoryAdd}>M+</Button>
            <Button variant="outline" onClick={memorySubtract}>M-</Button>
            <Button variant="destructive" onClick={clear}>C</Button>

            {/* Row 2: Functions */}
            <Button variant="outline" onClick={() => handleFunction("sin")}>sin</Button>
            <Button variant="outline" onClick={() => handleFunction("cos")}>cos</Button>
            <Button variant="outline" onClick={() => handleFunction("tan")}>tan</Button>
            <Button variant="outline" onClick={() => handleFunction("log")}>log</Button>
            <Button variant="outline" onClick={() => handleFunction("ln")}>ln</Button>

            {/* Row 3: More Functions */}
            <Button variant="outline" onClick={() => handleFunction("sqrt")}>√</Button>
            <Button variant="outline" onClick={() => handleFunction("square")}>x²</Button>
            <Button variant="outline" onClick={() => handleFunction("cube")}>x³</Button>
            <Button variant="outline" onClick={() => handleConstant("π")}>π</Button>
            <Button variant="outline" onClick={() => handleConstant("e")}>e</Button>

            {/* Row 4: Numbers & Operators */}
            <Button onClick={() => handleNumber("7")}>7</Button>
            <Button onClick={() => handleNumber("8")}>8</Button>
            <Button onClick={() => handleNumber("9")}>9</Button>
            <Button variant="secondary" onClick={() => handleOperator("÷")}>÷</Button>
            <Button variant="outline" onClick={clearEntry}>CE</Button>

            {/* Row 5 */}
            <Button onClick={() => handleNumber("4")}>4</Button>
            <Button onClick={() => handleNumber("5")}>5</Button>
            <Button onClick={() => handleNumber("6")}>6</Button>
            <Button variant="secondary" onClick={() => handleOperator("×")}>×</Button>
            <Button variant="outline" onClick={() => handleFunction("1/x")}>1/x</Button>

            {/* Row 6 */}
            <Button onClick={() => handleNumber("1")}>1</Button>
            <Button onClick={() => handleNumber("2")}>2</Button>
            <Button onClick={() => handleNumber("3")}>3</Button>
            <Button variant="secondary" onClick={() => handleOperator("-")}>-</Button>
            <Button variant="outline" onClick={() => handleFunction("abs")}>|x|</Button>

            {/* Row 7 */}
            <Button onClick={() => handleNumber("0")} className="col-span-2">0</Button>
            <Button onClick={() => handleNumber(".")}>.</Button>
            <Button variant="secondary" onClick={() => handleOperator("+")}>+</Button>
            <Button onClick={calculate} className="bg-primary text-primary-foreground hover:bg-primary/90">=</Button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <Card className="p-3">
              <div className="text-sm font-medium mb-2 flex items-center justify-between">
                <span>History</span>
                <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto text-xs font-mono">
                {history.map((entry, index) => (
                  <div key={index} className="text-muted-foreground">
                    {entry}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}