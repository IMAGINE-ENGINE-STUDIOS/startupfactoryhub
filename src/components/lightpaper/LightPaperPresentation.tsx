import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronLeft, ChevronRight, Play, Download, Upload, ImageIcon, Keyboard } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIsMobile } from "@/hooks/use-mobile";

interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  layout: "title" | "content" | "two-column" | "image";
  imageUrl?: string;
  imagePosition?: { x: number; y: number; width: number; height: number };
  animation?: "none" | "fade" | "slide" | "zoom";
  transition?: "none" | "fade" | "slide" | "zoom";
}

export function LightPaperPresentation() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      title: "Welcome to LightPaper",
      content: "Create stunning presentations with ease",
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      layout: "title",
      animation: "fade",
      transition: "fade"
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Presentation");
  const isMobile = useIsMobile();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'd', ctrl: true, handler: (e) => { e.preventDefault(); if (!isPresenting) { const newSlide = {...currentSlide, id: Date.now().toString()}; setSlides([...slides, newSlide]); toast.success("Slide duplicated!"); } }, description: 'Duplicate slide' },
    { key: 'Delete', handler: () => { if (!isPresenting) deleteSlide(); }, description: 'Delete slide' },
    { key: 'F5', handler: (e) => { e.preventDefault(); setIsPresenting(true); }, description: 'Start presentation' },
    { key: 'Escape', handler: () => { if (isPresenting) setIsPresenting(false); }, description: 'Exit presentation' },
    { key: 'ArrowLeft', handler: () => prevSlide(), description: 'Previous slide' },
    { key: 'ArrowRight', handler: () => nextSlide(), description: 'Next slide' },
    { key: '/', ctrl: true, handler: (e) => { e.preventDefault(); setShowShortcutsDialog(true); }, description: 'Shortcuts' },
  ], true);

  const currentSlide = slides[currentSlideIndex];

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: "New Slide",
      content: "Add your content here",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      layout: "content",
      animation: "none",
      transition: "fade"
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
    toast.success("Slide added!");
  };

  const deleteSlide = () => {
    if (slides.length === 1) {
      toast.error("Cannot delete the last slide");
      return;
    }
    const newSlides = slides.filter((_, index) => index !== currentSlideIndex);
    setSlides(newSlides);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
    toast.success("Slide deleted!");
  };

  const updateSlide = (updates: Partial<Slide>) => {
    const newSlides = [...slides];
    newSlides[currentSlideIndex] = { ...currentSlide, ...updates };
    setSlides(newSlides);
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const exportPresentation = () => {
    const dataStr = JSON.stringify({ title: projectTitle, slides }, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${projectTitle}.json`;
    link.click();
    toast.success("Presentation exported!");
  };

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image file size must be less than 20MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        updateSlide({ imageUrl: e.target?.result as string });
        toast.success("Image added!");
      };
      reader.onerror = () => {
        toast.error("Failed to load image");
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {!isPresenting ? (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportPresentation}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={addSlide}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Slide
                </Button>
                <Button variant="outline" size="sm" onClick={deleteSlide}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button variant="outline" size="sm" onClick={exportPresentation}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" onClick={handleImageUpload}>
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Add Image
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowShortcutsDialog(true)}>
                  <Keyboard className="h-4 w-4 mr-1" />
                  {!isMobile && "Shortcuts"}
                </Button>
                <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlideIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentSlideIndex + 1} / {slides.length}
                </span>
                <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlideIndex === slides.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => setIsPresenting(true)} className="ml-4">
                  <Play className="h-4 w-4 mr-1" />
                  Present
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Layout</label>
                <Select value={currentSlide.layout} onValueChange={(value) => updateSlide({ layout: value as Slide["layout"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="title">Title Slide</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="two-column">Two Column</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Animation</label>
                <Select value={currentSlide.animation || "none"} onValueChange={(value) => updateSlide({ animation: value as Slide["animation"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Transition</label>
                <Select value={currentSlide.transition || "fade"} onValueChange={(value) => updateSlide({ transition: value as Slide["transition"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Background</label>
                <input
                  type="color"
                  value={currentSlide.backgroundColor}
                  onChange={(e) => updateSlide({ backgroundColor: e.target.value })}
                  className="w-full h-10 cursor-pointer rounded"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Text Color</label>
                <input
                  type="color"
                  value={currentSlide.textColor}
                  onChange={(e) => updateSlide({ textColor: e.target.value })}
                  className="w-full h-10 cursor-pointer rounded"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  value={currentSlide.title}
                  onChange={(e) => updateSlide({ title: e.target.value })}
                  placeholder="Slide title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Content</label>
                <Textarea
                  value={currentSlide.content}
                  onChange={(e) => updateSlide({ content: e.target.value })}
                  placeholder="Slide content"
                  rows={6}
                />
              </div>
            </div>
          </Card>

          {/* Slide Preview */}
          <Card
            className="p-12 min-h-[400px] flex flex-col justify-center items-center text-center"
              style={{
                backgroundColor: currentSlide.backgroundColor,
                color: currentSlide.textColor
              }}
            >
              <div className={`relative z-10 ${
                currentSlide.animation === "fade" ? "animate-fade-in" :
                currentSlide.animation === "slide" ? "animate-slide-in-right" :
                currentSlide.animation === "zoom" ? "animate-scale-in" : ""
              }`}>
                <h1 className="text-5xl font-bold mb-6">{currentSlide.title}</h1>
                {currentSlide.imageUrl && (
                  <img 
                    src={currentSlide.imageUrl} 
                    alt="Slide" 
                    className="max-w-full max-h-[300px] object-contain mx-auto mb-6 rounded-lg"
                  />
                )}
                <p className="text-2xl whitespace-pre-wrap max-w-3xl">{currentSlide.content}</p>
              </div>
            </Card>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(index)}
                className={`flex-shrink-0 w-32 h-20 rounded border-2 transition-all ${
                  index === currentSlideIndex ? "border-primary scale-105" : "border-border"
                }`}
                style={{ backgroundColor: slide.backgroundColor }}
              >
                <div className="p-2 text-xs truncate" style={{ color: slide.textColor }}>
                  {slide.title}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="fixed inset-0 z-50 bg-black">
          <div
            className="w-full h-full flex flex-col justify-center items-center text-center p-16"
              style={{
                backgroundColor: currentSlide.backgroundColor,
                color: currentSlide.textColor
              }}
            >
              <div className={`relative z-10 ${
                currentSlide.transition === "fade" ? "animate-fade-in" :
                currentSlide.transition === "slide" ? "animate-slide-in-right" :
                currentSlide.transition === "zoom" ? "animate-scale-in" : ""
              }`}>
                <h1 className="text-7xl font-bold mb-8">{currentSlide.title}</h1>
                {currentSlide.imageUrl && (
                  <img 
                    src={currentSlide.imageUrl} 
                    alt="Slide" 
                    className="max-w-full max-h-[500px] object-contain mx-auto mb-8 rounded-lg"
                  />
                )}
                <p className="text-4xl whitespace-pre-wrap max-w-5xl">{currentSlide.content}</p>
              </div>
            </div>
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-black/80 p-4 rounded-lg">
            <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlideIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm">
              {currentSlideIndex + 1} / {slides.length}
            </span>
            <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlideIndex === slides.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsPresenting(false)}>
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        type="presentation"
      />
    </div>
  );
}
