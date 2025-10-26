import { Canvas as FabricCanvas, IText, Rect, Circle, PencilBrush, FabricObject } from 'fabric';
import { ToolType } from '@/stores/pdfEditorStore';

export class FabricCanvasManager {
  private canvas: FabricCanvas;
  private activeTool: ToolType = 'select';
  private activeColor: string = '#000000';
  private history: string[] = [];
  private historyStep: number = -1;
  private onSelectionChange?: (obj: FabricObject | null) => void;

  constructor(canvasElement: HTMLCanvasElement, width: number, height: number) {
    this.canvas = new FabricCanvas(canvasElement, {
      width,
      height,
      backgroundColor: 'transparent',
      selection: true,
    });

    // Initialize freeDrawingBrush
    this.canvas.freeDrawingBrush = new PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.color = this.activeColor;
    this.canvas.freeDrawingBrush.width = 2;

    this.setupEventHandlers();
    this.saveState(); // Save initial state
  }

  private setupEventHandlers() {
    // Handle mouse click for adding objects
    this.canvas.on('mouse:down', (event) => {
      if (!event.pointer) return;
      
      const { x, y } = event.pointer;

      switch (this.activeTool) {
        case 'text':
          this.addText(x, y);
          break;
        case 'rectangle':
          this.addRectangle(x, y);
          break;
        case 'circle':
          this.addCircle(x, y);
          break;
        case 'erase':
          this.deleteObjectAtPoint(x, y);
          break;
      }
    });

    // Handle object modifications for undo/redo
    this.canvas.on('object:modified', () => this.saveState());
    this.canvas.on('object:added', () => this.saveState());
    this.canvas.on('object:removed', () => this.saveState());

    // Handle selection changes
    this.canvas.on('selection:created', (e) => {
      if (this.onSelectionChange && e.selected && e.selected[0]) {
        this.onSelectionChange(e.selected[0]);
      }
    });
    
    this.canvas.on('selection:updated', (e) => {
      if (this.onSelectionChange && e.selected && e.selected[0]) {
        this.onSelectionChange(e.selected[0]);
      }
    });
    
    this.canvas.on('selection:cleared', () => {
      if (this.onSelectionChange) {
        this.onSelectionChange(null);
      }
    });
  }

  setSelectionChangeCallback(callback: (obj: FabricObject | null) => void) {
    this.onSelectionChange = callback;
  }

  setTool(tool: ToolType) {
    this.activeTool = tool;
    
    // Enable/disable drawing mode
    this.canvas.isDrawingMode = tool === 'draw';
    
    // Enable/disable selection
    this.canvas.selection = tool === 'select';
    
    // Update objects selectability
    this.canvas.forEachObject((obj) => {
      obj.selectable = tool === 'select';
      obj.evented = tool === 'select' || tool === 'erase';
    });

    this.canvas.requestRenderAll();
  }

  setColor(color: string) {
    this.activeColor = color;
    if (this.canvas.freeDrawingBrush) {
      this.canvas.freeDrawingBrush.color = color;
    }
  }

  addText(x: number, y: number) {
    const text = new IText('Text', {
      left: x,
      top: y,
      fill: this.activeColor,
      fontSize: 20,
      fontFamily: 'Arial',
      selectable: true,
    });
    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    this.setTool('select'); // Auto-switch to select after adding
  }

  addRectangle(x: number, y: number) {
    const rect = new Rect({
      left: x,
      top: y,
      fill: this.activeColor,
      width: 100,
      height: 100,
      selectable: true,
    });
    this.canvas.add(rect);
    this.canvas.setActiveObject(rect);
    this.setTool('select');
  }

  addCircle(x: number, y: number) {
    const circle = new Circle({
      left: x,
      top: y,
      fill: this.activeColor,
      radius: 50,
      selectable: true,
    });
    this.canvas.add(circle);
    this.canvas.setActiveObject(circle);
    this.setTool('select');
  }

  deleteObjectAtPoint(x: number, y: number) {
    const target = this.canvas.getActiveObject();
    if (target) {
      this.canvas.remove(target);
    } else {
      // If no active object, try to find object at coordinates
      const objects = this.canvas.getObjects();
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const objLeft = obj.left || 0;
        const objTop = obj.top || 0;
        const objWidth = (obj.width || 0) * (obj.scaleX || 1);
        const objHeight = (obj.height || 0) * (obj.scaleY || 1);
        
        if (x >= objLeft && x <= objLeft + objWidth &&
            y >= objTop && y <= objTop + objHeight) {
          this.canvas.remove(obj);
          break;
        }
      }
    }
    this.canvas.requestRenderAll();
  }

  deleteSelected() {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => this.canvas.remove(obj));
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
    }
  }

  clear() {
    this.canvas.clear();
    this.canvas.backgroundColor = 'transparent';
    this.canvas.requestRenderAll();
  }

  setDimensions(width: number, height: number) {
    this.canvas.setDimensions({ width, height });
  }

  serializeCanvas(): string {
    return JSON.stringify(this.canvas.toJSON());
  }

  loadFromJSON(json: string) {
    try {
      this.canvas.loadFromJSON(json, () => {
        this.canvas.requestRenderAll();
      });
    } catch (error) {
      console.error('Failed to load canvas from JSON:', error);
    }
  }

  getCanvas(): FabricCanvas {
    return this.canvas;
  }

  // Undo/Redo functionality
  private saveState() {
    // Remove future states if we're not at the end
    if (this.historyStep < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyStep + 1);
    }

    const json = this.serializeCanvas();
    this.history.push(json);
    this.historyStep = this.history.length - 1;

    // Limit history to 50 states
    if (this.history.length > 50) {
      this.history.shift();
      this.historyStep--;
    }
  }

  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.loadFromJSON(this.history[this.historyStep]);
    }
  }

  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.loadFromJSON(this.history[this.historyStep]);
    }
  }

  canUndo(): boolean {
    return this.historyStep > 0;
  }

  canRedo(): boolean {
    return this.historyStep < this.history.length - 1;
  }

  // Property updates
  updateSelectedObjectProperty(property: string, value: any) {
    const activeObject = this.canvas.getActiveObject();
    if (!activeObject) return;

    (activeObject as any)[property] = value;
    activeObject.setCoords();
    this.canvas.requestRenderAll();
    this.saveState();
  }

  getSelectedObject(): FabricObject | null {
    return this.canvas.getActiveObject() || null;
  }

  dispose() {
    this.canvas.dispose();
  }
}
