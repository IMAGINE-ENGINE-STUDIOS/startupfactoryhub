import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Video, 
  Camera, 
  Image as ImageIcon, 
  Type, 
  X, 
  Play, 
  Pause,
  Plus,
  Hash
} from "lucide-react";

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
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<"short" | "long" | "image" | "text">("short");
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Determine post type based on file type
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          if (video.duration <= 60) {
            setPostType("short");
          } else {
            setPostType("long");
          }
        };
        video.src = url;
      } else if (file.type.startsWith('image/')) {
        setPostType("image");
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Click stop when you're done recording",
      });
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera access to record videos",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    toast({
      title: "Recording stopped",
      description: "Your video has been saved",
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your post",
        variant: "destructive",
      });
      return;
    }

    if (postType !== "text" && !selectedFile && !isRecording) {
      toast({
        title: "Content required",
        description: "Please add media content or switch to text post",
        variant: "destructive",
      });
      return;
    }

    const shortData = {
      title: title.trim(),
      description: description.trim(),
      tags,
      postType,
      file: selectedFile,
      previewUrl
    };

    onSave(shortData);
    handleClose();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setNewTag("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setPostType("short");
    setIsRecording(false);
    setIsPlaying(false);
    onClose();
  };

  const togglePreviewPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Type Tabs */}
          <Tabs value={postType} onValueChange={(value) => setPostType(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="short" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Short
              </TabsTrigger>
              <TabsTrigger value="long" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Long Video
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="text" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="short" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-32 border-dashed"
                      >
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Upload Video</p>
                          <p className="text-xs text-muted-foreground">Max 60s, 100MB</p>
                        </div>
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={isRecording ? stopRecording : startRecording}
                        className="h-32 border-dashed"
                      >
                        <div className="text-center">
                          <Camera className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">{isRecording ? 'Stop Recording' : 'Record Video'}</p>
                          <p className="text-xs text-muted-foreground">Direct camera</p>
                        </div>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="long" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-dashed"
                  >
                    <div className="text-center">
                      <Video className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Upload Long Video</p>
                      <p className="text-xs text-muted-foreground">Any duration, 100MB max</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-dashed"
                  >
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Upload Images</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, GIF</p>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Type className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Text-only post selected</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Preview */}
          {(previewUrl || isRecording) && (
            <Card>
              <CardContent className="pt-6">
                <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    src={previewUrl || undefined}
                    controls={!isRecording}
                  />
                  {previewUrl && postType === "short" && (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={togglePreviewPlay}
                      className="absolute inset-0 text-white hover:bg-black/20"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your post a catchy title..."
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about your post..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/500</p>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tags</label>
            <div className="flex items-center gap-2 mb-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  className="pl-10"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </div>
              <Button onClick={addTag} size="sm" disabled={!newTag.trim() || tags.length >= 10}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="pl-2 pr-1">
                  #{tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTag(tag)}
                    className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{tags.length}/10 tags</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Create Post
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ShortsCreator;