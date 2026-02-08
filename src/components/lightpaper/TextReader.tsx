import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, VolumeX, Play, Pause, Square, SkipForward, SkipBack, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TextReaderProps {
  getDocumentText: () => string;
  isOpen: boolean;
  onClose: () => void;
}

export function TextReader({ getDocumentText, isOpen, onClose }: TextReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        // Default to first English voice
        const english = available.find(v => v.lang.startsWith("en")) || available[0];
        if (english && !selectedVoice) setSelectedVoice(english.name);
      }
    };
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startReading = useCallback(() => {
    const text = getDocumentText();
    if (!text.trim()) return;

    speechSynthesis.cancel();
    textRef.current = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.onboundary = (e) => {
      if (e.name === "word") {
        const word = text.substring(e.charIndex, e.charIndex + e.charLength);
        setCurrentWord(word);
        setProgress(Math.round((e.charIndex / text.length) * 100));
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
      setCurrentWord("");
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
    setProgress(0);
  }, [getDocumentText, rate, pitch, volume, selectedVoice, voices]);

  const togglePause = () => {
    if (isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    } else {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setCurrentWord("");
  };

  const handleClose = () => {
    stop();
    onClose();
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-[150] bg-background border rounded-full shadow-lg flex items-center gap-1 p-1 pl-3">
        <Volume2 className="h-4 w-4 text-primary" />
        {currentWord && <span className="text-xs font-medium max-w-[80px] truncate">{currentWord}</span>}
        {!isPlaying ? (
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={startReading}><Play className="h-4 w-4" /></Button>
        ) : (
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={togglePause}>
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={stop} disabled={!isPlaying}><Square className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={() => setIsMinimized(false)}><Minus className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={handleClose}><X className="h-4 w-4" /></Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-[150] bg-background border rounded-xl shadow-xl w-[320px] max-w-[calc(100vw-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Read Aloud</span>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsMinimized(true)}><Minus className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleClose}><X className="h-3 w-3" /></Button>
        </div>
      </div>

      {/* Progress */}
      <div className="px-4 pt-3">
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        {currentWord && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Reading: <span className="font-medium text-foreground">{currentWord}</span>
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-4 py-3">
        {!isPlaying ? (
          <Button size="sm" onClick={startReading} className="gap-1.5">
            <Play className="h-4 w-4" /> Play
          </Button>
        ) : (
          <>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={togglePause}>
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={stop}>
              <Square className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>

      {/* Settings */}
      <div className="px-4 pb-4 space-y-3">
        {/* Voice */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Voice</label>
          <Select value={selectedVoice} onValueChange={setSelectedVoice}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {voices.map(v => (
                <SelectItem key={v.name} value={v.name} className="text-xs">
                  {v.name} ({v.lang})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-muted-foreground">Speed</label>
            <span className="text-xs text-muted-foreground">{rate}x</span>
          </div>
          <Slider value={[rate]} min={0.5} max={3} step={0.25} onValueChange={([v]) => setRate(v)} className="w-full" />
        </div>

        {/* Pitch */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-muted-foreground">Pitch</label>
            <span className="text-xs text-muted-foreground">{pitch}</span>
          </div>
          <Slider value={[pitch]} min={0.5} max={2} step={0.1} onValueChange={([v]) => setPitch(v)} className="w-full" />
        </div>

        {/* Volume */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-xs font-medium text-muted-foreground">Volume</label>
            <span className="text-xs text-muted-foreground">{Math.round(volume * 100)}%</span>
          </div>
          <Slider value={[volume]} min={0} max={1} step={0.1} onValueChange={([v]) => setVolume(v)} className="w-full" />
        </div>
      </div>
    </div>
  );
}
