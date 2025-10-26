import { Canvas as FabricCanvas, IText, Rect, Circle, PencilBrush, FabricObject } from 'fabric';
import { ToolType } from '@/stores/pdfEditorStore';

export class FabricCanvasManager {
  private canvas: FabricCanvas;
  private activeTool: ToolType = 'select';
  private activeColor: string = '#000000';

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

  dispose() {
    this.canvas.dispose();
  }
}
