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

  // Apply remote operation without adding to command history
  applyRemoteOperation(operation: PDFOperation) {
    // Check if operation already exists to prevent duplicates
    const exists = this.operations.some(op => op.id === operation.id);
    if (exists) {
      console.log('Operation already exists, skipping:', operation.id);
      return;
    }

    console.log('Applying remote operation:', operation);
    this.operations.push(operation);
  }

  // Merge remote operations, handling conflicts by timestamp
  mergeOperations(remoteOps: PDFOperation[]) {
    remoteOps.forEach(remoteOp => {
      const existingIndex = this.operations.findIndex(op => op.id === remoteOp.id);
      
      if (existingIndex === -1) {
        // New operation, add it
        this.operations.push(remoteOp);
      } else {
        // Operation exists, keep the one with latest timestamp
        const existing = this.operations[existingIndex];
        if (remoteOp.timestamp > existing.timestamp) {
          this.operations[existingIndex] = remoteOp;
          console.log('Replaced operation with newer version:', remoteOp.id);
        }
      }
    });

    // Sort operations by timestamp
    this.operations.sort((a, b) => a.timestamp - b.timestamp);
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
    return this.operations.filter(op => !op.savedToBackend);
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
          console.log('Processing', pending.length, 'pending operations...');
          await this.onAutoSave(pending);
          // Mark operations as saved to backend
          pending.forEach(op => {
            op.savedToBackend = true;
            op.timestamp = Date.now();
          });
          console.log('Successfully saved operations to backend');
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
