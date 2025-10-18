import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ChevronLeft, ChevronRight, Play, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  layout: "title" | "content" | "two-column" | "image";
}

export function LightPaperPresentation() {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: "1",
      title: "Welcome to LightPaper",
      content: "Create stunning presentations with ease",
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      layout: "title"
    }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  const addSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: "New Slide",
      content: "Add your content here",
      backgroundColor: "#ffffff",
      textColor: "#000000",
      layout: "content"
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
    const data = JSON.stringify(slides, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presentation.json";
    a.click();
    toast.success("Presentation exported!");
  };

  return (
    <div className="space-y-4">
      {!isPresenting ? (
        <>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
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
              </div>
              <div className="flex items-center gap-2">
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

            <div className="grid grid-cols-2 gap-4 mb-4">
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
              <div className="grid grid-cols-2 gap-2">
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
            <h1 className="text-5xl font-bold mb-6">{currentSlide.title}</h1>
            <p className="text-2xl whitespace-pre-wrap max-w-3xl">{currentSlide.content}</p>
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
            <h1 className="text-7xl font-bold mb-8">{currentSlide.title}</h1>
            <p className="text-4xl whitespace-pre-wrap max-w-5xl">{currentSlide.content}</p>
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
    </div>
  );
}
