import { Canvas as FabricCanvas, IText, PencilBrush, Rect, Circle, FabricImage } from 'fabric';

export interface FabricCanvasManager {
  canvas: FabricCanvas;
  pageNumber: number;
  isDirty: boolean;
}

export class PDFFabricManager {
  private canvases: Map<number, FabricCanvasManager> = new Map();
  private activeColor: string = '#000000';
  private activeFontSize: number = 16;
  private activeTool: 'select' | 'text' | 'draw' | 'rect' | 'circle' | 'erase' = 'select';

  createCanvas(canvasElement: HTMLCanvasElement, pageNumber: number, width: number, height: number): FabricCanvas {
    // Dispose existing canvas if any
    this.disposeCanvas(pageNumber);

    const canvas = new FabricCanvas(canvasElement, {
      width,
      height,
      backgroundColor: 'transparent',
      selection: true,
      preserveObjectStacking: true,
    });

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = this.activeColor;
    canvas.freeDrawingBrush.width = 2;

    // Add mouse event logging for debugging
    canvas.on('mouse:down', (e) => {
      console.log('[Fabric] Mouse down on page', pageNumber, '- Tool:', this.activeTool, '- Pointer:', e.pointer);
    });

    canvas.on('mouse:up', () => {
      console.log('[Fabric] Mouse up on page', pageNumber);
    });

    // Track changes
    canvas.on('object:added', () => this.markDirty(pageNumber));
    canvas.on('object:modified', () => this.markDirty(pageNumber));
    canvas.on('object:removed', () => this.markDirty(pageNumber));

    this.canvases.set(pageNumber, {
      canvas,
      pageNumber,
      isDirty: false,
    });

    return canvas;
  }

  getCanvas(pageNumber: number): FabricCanvas | undefined {
    return this.canvases.get(pageNumber)?.canvas;
  }

  disposeCanvas(pageNumber: number): void {
    const manager = this.canvases.get(pageNumber);
    if (manager) {
      manager.canvas.dispose();
      this.canvases.delete(pageNumber);
    }
  }

  disposeAll(): void {
    this.canvases.forEach((manager) => manager.canvas.dispose());
    this.canvases.clear();
  }

  setTool(tool: 'select' | 'text' | 'draw' | 'rect' | 'circle' | 'erase'): void {
    console.log('[PDFFabricManager] Setting tool:', tool);
    this.activeTool = tool;
    this.canvases.forEach(({ canvas }) => {
      // Enable drawing mode only for draw tool
      canvas.isDrawingMode = tool === 'draw';
      
      // Enable selection for select and erase tools
      canvas.selection = tool === 'select' || tool === 'erase';
      
      // Make objects selectable for select, erase, and text tools
      canvas.forEachObject((obj) => {
        obj.selectable = tool === 'select' || tool === 'erase';
      });
      
      if (tool === 'draw' && canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = this.activeColor;
        canvas.freeDrawingBrush.width = 2;
      }
      
      canvas.renderAll();
    });
  }

  getActiveTool(): string {
    return this.activeTool;
  }

  handleCanvasClick(pageNumber: number, x: number, y: number): void {
    console.log('[PDFFabricManager] Canvas click:', { pageNumber, x, y, tool: this.activeTool });
    
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    switch (this.activeTool) {
      case 'text':
        this.addText(pageNumber, x, y);
        break;
      case 'select':
        // Let Fabric handle selection naturally
        break;
      case 'draw':
        // Drawing mode is already active, no action needed
        break;
      case 'erase':
        // Eraser deletes on click - check if there's a selected object
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          canvas.remove(activeObject);
          canvas.discardActiveObject();
          canvas.renderAll();
        }
        break;
      // rect and circle are added via toolbar buttons, not clicks
    }
  }

  setColor(color: string): void {
    this.activeColor = color;
    this.canvases.forEach(({ canvas }) => {
      if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
      }
    });
  }

  setFontSize(size: number): void {
    this.activeFontSize = size;
  }

  addText(pageNumber: number, x: number, y: number): void {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    console.log('[PDFFabricManager] Adding text at:', { x, y, fontSize: this.activeFontSize, color: this.activeColor });

    const text = new IText('Type here', {
      left: x - 40, // Center the text around click point
      top: y - 10,
      fontSize: this.activeFontSize,
      fill: this.activeColor,
      fontFamily: 'Arial',
      selectable: true,
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    // Enter editing mode after a brief delay to ensure it's rendered
    setTimeout(() => {
      text.enterEditing();
      text.selectAll();
    }, 50);
  }

  addRectangle(pageNumber: number): void {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 150,
      height: 100,
      fill: 'transparent',
      stroke: this.activeColor,
      strokeWidth: 2,
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
  }

  addCircle(pageNumber: number): void {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: 'transparent',
      stroke: this.activeColor,
      strokeWidth: 2,
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
  }

  async addImage(pageNumber: number, imageUrl: string): Promise<void> {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    return new Promise((resolve, reject) => {
      FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous',
      }).then((img) => {
        img.scaleToWidth(200);
        img.set({ left: 100, top: 100 });
        canvas.add(img);
        canvas.setActiveObject(img);
        resolve();
      }).catch(reject);
    });
  }

  deleteSelected(pageNumber: number): void {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => canvas.remove(obj));
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }

  clearPage(pageNumber: number): void {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;
    canvas.clear();
  }

  exportToJSON(pageNumber: number): string | null {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return null;
    return JSON.stringify(canvas.toJSON());
  }

  exportAllToJSON(): Record<number, string> {
    const result: Record<number, string> = {};
    this.canvases.forEach((manager, pageNumber) => {
      result[pageNumber] = JSON.stringify(manager.canvas.toJSON());
    });
    return result;
  }

  async loadFromJSON(pageNumber: number, json: string): Promise<void> {
    const canvas = this.getCanvas(pageNumber);
    if (!canvas) return;

    return new Promise((resolve, reject) => {
      canvas.loadFromJSON(json).then(() => {
        canvas.renderAll();
        resolve();
      }).catch(reject);
    });
  }

  async loadAllFromJSON(data: Record<number, string>): Promise<void> {
    const promises = Object.entries(data).map(([pageStr, json]) => {
      const pageNumber = parseInt(pageStr, 10);
      return this.loadFromJSON(pageNumber, json);
    });
    await Promise.all(promises);
  }

  private markDirty(pageNumber: number): void {
    const manager = this.canvases.get(pageNumber);
    if (manager) {
      manager.isDirty = true;
    }
  }

  isDirtyPage(pageNumber: number): boolean {
    return this.canvases.get(pageNumber)?.isDirty || false;
  }

  hasAnyDirtyPages(): boolean {
    return Array.from(this.canvases.values()).some((manager) => manager.isDirty);
  }

  clearDirtyFlags(): void {
    this.canvases.forEach((manager) => {
      manager.isDirty = false;
    });
  }
}
