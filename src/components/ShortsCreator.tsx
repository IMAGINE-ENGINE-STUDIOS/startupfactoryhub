import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Video, Upload, X, Plus, Hash, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShortsCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shortData: any) => void;
}

const ShortsCreator = ({ isOpen, onClose, onSave }: ShortsCreatorProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileType = file.type;
      
      if (!fileType.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Only short videos are allowed (60 seconds max)",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be under 500MB for maximum quality",
          variant: "destructive",
        });
        return;
      }

      // Check video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = Math.floor(video.duration);
        
        if (duration > 60) {
          toast({
            title: "Video too long",
            description: `Shorts must be 60 seconds or less. Your video is ${duration} seconds.`,
            variant: "destructive",
          });
          setSelectedFile(null);
          setPreviewUrl(null);
          setVideoDuration(null);
          return;
        }
        
        setVideoDuration(duration);
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      };
      
      video.src = URL.createObjectURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        }, 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000
        } 
      });
      
      // Try best quality codecs in order of preference
      let options;
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        options = { 
          mimeType: 'video/webm;codecs=vp9,opus',
          videoBitsPerSecond: 8000000 // 8 Mbps for high quality
        };
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
        options = { 
          mimeType: 'video/webm;codecs=h264,opus',
          videoBitsPerSecond: 8000000
        };
      } else {
        options = { 
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 5000000 // 5 Mbps fallback
        };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        
        // Check duration of recorded video
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const duration = Math.floor(video.duration);
          
          if (duration > 60) {
            toast({
              title: "Recording too long",
              description: `Shorts must be 60 seconds or less. Your recording is ${duration} seconds.`,
              variant: "destructive",
            });
            return;
          }
          
          setVideoDuration(duration);
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        };
        
        video.src = URL.createObjectURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 60000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record videos",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setVideoDuration(null);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim().replace(/^#/, '')]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!selectedFile) {
      toast({
        title: "Video required",
        description: "Please select or record a short video (60 seconds max)",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your short",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await onSave({
        title,
        description,
        tags,
        file: selectedFile,
        postType: 'short'
      });

      handleClose();
    } catch (error) {
      console.error('Error saving short:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setNewTag("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsRecording(false);
    setVideoDuration(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Short Video (Max 60 seconds)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            {!previewUrl ? (
              <div className="space-y-4">
                <Video className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload or record a short video (60 seconds max)
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <Square className="w-4 h-4 mr-2" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Record Video
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <video
                  src={previewUrl}
                  controls
                  className="w-full rounded-lg max-h-96"
                />
                {videoDuration && (
                  <p className="text-sm text-muted-foreground">
                    Duration: {videoDuration} seconds
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={removeMedia}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove Video
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your short a catchy title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Hashtags</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a hashtag"
                  className="pl-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    #{tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isUploading}>
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                'Create Short'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShortsCreator;