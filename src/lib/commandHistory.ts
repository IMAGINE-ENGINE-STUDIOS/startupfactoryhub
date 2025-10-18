// Command pattern for undo/redo functionality

export interface Command {
  execute: () => void;
  undo: () => void;
  description?: string;
}

export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  execute(command: Command): void {
    // Remove any commands after current index (when user does something after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new command
    this.history.push(command);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
    
    command.execute();
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    
    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    
    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.execute();
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistorySize(): number {
    return this.history.length;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
