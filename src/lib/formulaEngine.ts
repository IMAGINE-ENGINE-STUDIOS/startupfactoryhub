// Enhanced formula engine for spreadsheet calculations

export class FormulaEngine {
  private data: { [key: string]: { value: string; formula?: string } };

  constructor(data: { [key: string]: { value: string; formula?: string } }) {
    this.data = data;
  }

  evaluate(cellId: string): string {
    const cell = this.data[cellId];
    if (!cell) return "";
    if (!cell.formula) return cell.value;
    return this.evaluateFormula(cell.formula);
  }

  private evaluateFormula(formula: string): string {
    try {
      if (!formula.startsWith("=")) return formula;

      let expression = formula.slice(1);

      // Handle built-in functions
      expression = this.handleFunctions(expression);

      // Replace cell references with their evaluated values
      expression = this.replaceCellReferences(expression);

      // Evaluate the final expression
      const result = this.safeEval(expression);
      return typeof result === "number" ? result.toFixed(2) : result.toString();
    } catch (error) {
      return "#ERROR";
    }
  }

  private handleFunctions(expression: string): string {
    // SUM function
    expression = expression.replace(/SUM\(([^)]+)\)/gi, (_, range) => {
      const cells = this.getCellsInRange(range);
      const sum = cells.reduce((acc, cellId) => {
        const val = parseFloat(this.evaluate(cellId)) || 0;
        return acc + val;
      }, 0);
      return sum.toString();
    });

    // AVERAGE function
    expression = expression.replace(/AVERAGE\(([^)]+)\)/gi, (_, range) => {
      const cells = this.getCellsInRange(range);
      const sum = cells.reduce((acc, cellId) => acc + (parseFloat(this.evaluate(cellId)) || 0), 0);
      return (sum / cells.length).toString();
    });

    // COUNT function
    expression = expression.replace(/COUNT\(([^)]+)\)/gi, (_, range) => {
      const cells = this.getCellsInRange(range);
      const count = cells.filter(cellId => !isNaN(parseFloat(this.evaluate(cellId)))).length;
      return count.toString();
    });

    // MIN function
    expression = expression.replace(/MIN\(([^)]+)\)/gi, (_, range) => {
      const cells = this.getCellsInRange(range);
      const values = cells.map(cellId => parseFloat(this.evaluate(cellId))).filter(v => !isNaN(v));
      return Math.min(...values).toString();
    });

    // MAX function
    expression = expression.replace(/MAX\(([^)]+)\)/gi, (_, range) => {
      const cells = this.getCellsInRange(range);
      const values = cells.map(cellId => parseFloat(this.evaluate(cellId))).filter(v => !isNaN(v));
      return Math.max(...values).toString();
    });

    // ROUND function
    expression = expression.replace(/ROUND\(([^,]+),(\d+)\)/gi, (_, num, decimals) => {
      const value = parseFloat(this.replaceCellReferences(num));
      return value.toFixed(parseInt(decimals));
    });

    // ABS function
    expression = expression.replace(/ABS\(([^)]+)\)/gi, (_, num) => {
      const value = parseFloat(this.replaceCellReferences(num));
      return Math.abs(value).toString();
    });

    // SQRT function
    expression = expression.replace(/SQRT\(([^)]+)\)/gi, (_, num) => {
      const value = parseFloat(this.replaceCellReferences(num));
      return Math.sqrt(value).toString();
    });

    // POWER function
    expression = expression.replace(/POWER\(([^,]+),([^)]+)\)/gi, (_, base, exp) => {
      const b = parseFloat(this.replaceCellReferences(base));
      const e = parseFloat(this.replaceCellReferences(exp));
      return Math.pow(b, e).toString();
    });

    // IF function
    expression = expression.replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (_, condition, trueVal, falseVal) => {
      const cond = this.safeEval(this.replaceCellReferences(condition));
      return cond ? trueVal.replace(/['"]/g, "") : falseVal.replace(/['"]/g, "");
    });

    // CONCATENATE function
    expression = expression.replace(/CONCATENATE\(([^)]+)\)/gi, (_, args) => {
      const parts = args.split(",").map((arg: string) => {
        const trimmed = arg.trim().replace(/['"]/g, "");
        return this.data[trimmed] ? this.evaluate(trimmed) : trimmed;
      });
      return `"${parts.join("")}"`;
    });

    // TODAY function
    expression = expression.replace(/TODAY\(\)/gi, () => {
      return `"${new Date().toLocaleDateString()}"`;
    });

    // NOW function
    expression = expression.replace(/NOW\(\)/gi, () => {
      return `"${new Date().toLocaleString()}"`;
    });

    return expression;
  }

  private getCellsInRange(range: string): string[] {
    const cells: string[] = [];
    
    if (range.includes(":")) {
      const [start, end] = range.split(":");
      const startCol = start.match(/[A-Z]+/)?.[0] || "";
      const startRow = parseInt(start.match(/\d+/)?.[0] || "0");
      const endCol = end.match(/[A-Z]+/)?.[0] || "";
      const endRow = parseInt(end.match(/\d+/)?.[0] || "0");

      const startColIndex = this.columnToIndex(startCol);
      const endColIndex = this.columnToIndex(endCol);

      for (let row = startRow; row <= endRow; row++) {
        for (let colIndex = startColIndex; colIndex <= endColIndex; colIndex++) {
          cells.push(this.indexToColumn(colIndex) + row);
        }
      }
    } else {
      cells.push(range);
    }

    return cells;
  }

  private columnToIndex(col: string): number {
    let index = 0;
    for (let i = 0; i < col.length; i++) {
      index = index * 26 + (col.charCodeAt(i) - 64);
    }
    return index;
  }

  private indexToColumn(index: number): string {
    let col = "";
    while (index > 0) {
      const remainder = (index - 1) % 26;
      col = String.fromCharCode(65 + remainder) + col;
      index = Math.floor((index - 1) / 26);
    }
    return col;
  }

  private replaceCellReferences(expression: string): string {
    return expression.replace(/([A-Z]+\d+)/g, (match) => {
      const value = this.evaluate(match);
      return isNaN(parseFloat(value)) ? "0" : value;
    });
  }

  private safeEval(expression: string): any {
    try {
      // Remove quotes around strings
      if (expression.startsWith('"') && expression.endsWith('"')) {
        return expression.slice(1, -1);
      }
      return Function(`"use strict"; return (${expression})`)();
    } catch {
      throw new Error("Invalid expression");
    }
  }
}