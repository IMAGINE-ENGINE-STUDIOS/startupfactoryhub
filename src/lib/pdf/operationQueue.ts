import { PDFOperation } from '@/types/pdf-editor';
import { Command, CommandHistory } from '@/lib/commandHistory';

export class OperationQueue {
  private operations: PDFOperation[] = [];
  private commandHistory: CommandHistory;
  private autoSaveInterval: number | null = null;
  private onAutoSave?: (operations: PDFOperation[]) => Promise<void>;

  constructor(onAutoSave?: (operations: PDFOperation[]) => Promise<void>) {
    this.commandHistory = new CommandHistory();
    this.onAutoSave = onAutoSave;
  }

  addOperation(operation: PDFOperation) {
    const command: Command = {
      execute: () => {
        this.operations.push(operation);
      },
      undo: () => {
        const index = this.operations.findIndex(op => op.id === operation.id);
        if (index !== -1) {
          this.operations.splice(index, 1);
        }
      },
      description: `${operation.type} at (${operation.x}, ${operation.y})`,
    };

    this.commandHistory.execute(command);
  }

  undo(): boolean {
    return this.commandHistory.undo();
  }

  redo(): boolean {
    return this.commandHistory.redo();
  }

  canUndo(): boolean {
    return this.commandHistory.canUndo();
  }

  canRedo(): boolean {
    return this.commandHistory.canRedo();
  }

  getOperations(): PDFOperation[] {
    return [...this.operations];
  }

  getPendingOperations(): PDFOperation[] {
    return this.operations.filter(op => !op.timestamp || Date.now() - op.timestamp < 2000);
  }

  clearOperations() {
    this.operations = [];
    this.commandHistory.clear();
  }

  startAutoSave(intervalMs: number = 2000) {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(async () => {
      const pending = this.getPendingOperations();
      if (pending.length > 0 && this.onAutoSave) {
        try {
          await this.onAutoSave(pending);
          // Mark operations as saved
          pending.forEach(op => {
            op.timestamp = Date.now();
          });
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  getHistoryInfo() {
    return {
      size: this.commandHistory.getHistorySize(),
      currentIndex: this.commandHistory.getCurrentIndex(),
    };
  }
}
