import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, MessageCircle, Share, Plus, Zap, TrendingUp, Users, 
  Bookmark, Repeat2, Send, Calendar, Image as ImageIcon, 
  Video, Sparkles, X, Trash2, Hash
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import ShortsCarousel from '@/components/ShortsCarousel';
import ShortsCreator from '@/components/ShortsCreator';
import GuestPrompt from '@/components/GuestPrompt';
import UserProfileDialog from '@/components/UserProfileDialog';

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_type: string;
  internship_data?: any;
  media_urls?: string[] | null;
  shared_post_id?: string | null;
  profiles?: {
    full_name: string;
    avatar_url?: string;
  } | null;
  user_role?: string | null;
  post_likes: { user_id: string }[];
  post_comments: { 
    id: string; 
    content: string; 
    created_at: string; 
    user_id: string;
    profiles?: {
      full_name: string;
      avatar_url?: string;
    } | null;
  }[];
  _count?: {
    post_likes: number;
    post_comments: number;
  };
}

interface UnifiedCommunityFeedProps {
  showCreatePost?: boolean;
  limit?: number;
}

export default function UnifiedCommunityFeed({ 
  showCreatePost = true, 
  limit = 10 
}: UnifiedCommunityFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [postHashtags, setPostHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileDialogOpen(true);
  };

  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
      fetchUserBookmarks();
    }
    
    // Set up real-time subscription
    const channel = supabase
      .channel('feed-posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        () => fetchPosts()
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'post_likes' },
        () => { fetchPosts(); if (user) fetchUserLikes(); }
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'post_likes' },
        () => { fetchPosts(); if (user) fetchUserLikes(); }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'post_comments' },
        () => fetchPosts()
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'feed_posts' },
        (payload) => {
          setPosts(posts => posts.filter(post => post.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, offset]);

  const fetchPosts = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    }
    
    const currentOffset = loadMore ? offset : 0;
    
    const { data: postsData, error: postsError} = await supabase
      .from('feed_posts')
      .select(`
        *,
        post_likes (user_id),
        post_comments (
          id,
          content,
          created_at,
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setLoadingMore(false);
      return;
    }

    // Check if there are more posts
    if (!postsData || postsData.length < limit) {
      setHasMore(false);
    }

    const userIds = [...new Set(postsData?.map(post => post.user_id).filter(Boolean) || [])];
    
    // Get all comment user IDs
    const commentUserIds = [...new Set(
      postsData?.flatMap(post => 
        post.post_comments?.map(comment => comment.user_id) || []
      ).filter(Boolean) || []
    )];
    
    // Combine all user IDs
    const allUserIds = [...new Set([...userIds, ...commentUserIds])];
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', allUserIds);

    // Fetch user roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {} as Record<string, any>);

    const rolesMap = (rolesData || []).reduce((acc, roleEntry) => {
      acc[roleEntry.user_id] = roleEntry.role;
      return acc;
    }, {} as Record<string, string>);

    const formattedPosts = (postsData || []).map(post => ({
      ...post,
      profiles: profilesMap[post.user_id] || null,
      user_role: rolesMap[post.user_id] || null,
      post_comments: (post.post_comments || []).map(comment => ({
        ...comment,
        profiles: profilesMap[comment.user_id] || null
      })),
      _count: {
        post_likes: post.post_likes?.length || 0,
        post_comments: post.post_comments?.length || 0
      }
    }));
    
    if (loadMore) {
      setPosts(prev => [...prev, ...formattedPosts]);
      setOffset(currentOffset + limit);
    } else {
      setPosts(formattedPosts);
      setOffset(limit);
      setHasMore(true);
    }
    
    setLoadingMore(false);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    
    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };

  const fetchUserBookmarks = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('post_bookmarks')
      .select('post_id')
      .eq('user_id', user.id);
    
    if (data) {
      setBookmarkedPosts(new Set(data.map(bookmark => bookmark.post_id)));
    }
  };

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setMediaFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => prev.filter((_, i) => i !== index));
  };

  const uploadMedia = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('feed-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: 'Upload Failed',
          description: uploadError.message,
          variant: 'destructive',
        });
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('feed-media')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) {
      if (!user) {
        toast({
          title: 'Sign In Required',
          description: 'Please sign in to create posts',
          variant: 'destructive',
        });
      }
      return;
    }

    setLoading(true);
    try {
      const mediaUrls: string[] = [];
      
      for (const file of mediaFiles) {
        const url = await uploadMedia(file);
        if (url) mediaUrls.push(url);
      }

      const hashtagString = postHashtags.length > 0 
        ? '\n\n' + postHashtags.map(tag => `#${tag}`).join(' ') 
        : '';

      const { error } = await supabase
        .from('feed_posts')
        .insert({
          content: newPost + hashtagString,
          user_id: user.id,
          post_type: 'update',
          media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });

      setNewPost('');
      setMediaFiles([]);
      setMediaPreview([]);
      setPostHashtags([]);
      setNewHashtag('');
      fetchPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to like posts', variant: 'destructive' });
      return;
    }

    const isLiked = likedPosts.has(postId);
    
    if (isLiked) {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      
      if (!error) {
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    } else {
      const { error } = await supabase
        .from('post_likes')
        .insert({ post_id: postId, user_id: user.id });
      
      if (!error) {
        setLikedPosts(prev => new Set([...prev, postId]));
      }
    }
  };

  const toggleBookmark = async (postId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to bookmark posts', variant: 'destructive' });
      return;
    }

    const isBookmarked = bookmarkedPosts.has(postId);
    
    if (isBookmarked) {
      const { error } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      
      if (!error) {
        setBookmarkedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast({ title: 'Bookmark removed' });
      }
    } else {
      const { error } = await supabase
        .from('post_bookmarks')
        .insert({ post_id: postId, user_id: user.id });
      
      if (!error) {
        setBookmarkedPosts(prev => new Set([...prev, postId]));
        toast({ title: 'Post bookmarked!' });
      }
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('feed_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({
        title: 'Post deleted',
        description: 'Your post has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive',
      });
    }
  };

  const sharePost = async (postId: string, isRepost: boolean = false) => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to share posts',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (isRepost) {
        const originalPost = posts.find(p => p.id === postId);
        if (!originalPost) return;

        const { error } = await supabase
          .from('feed_posts')
          .insert({
            content: `Reposted: ${originalPost.content}`,
            user_id: user.id,
            post_type: 'update',
            shared_post_id: postId,
          });

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Post reposted successfully!',
        });
        
        fetchPosts();
      } else {
        const url = `${window.location.origin}/post/${postId}`;
        await navigator.clipboard.writeText(url);
        
        toast({
          title: 'Success',
          description: 'Post link copied to clipboard!',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share post',
        variant: 'destructive',
      });
    }
  };

  const handleCreateShort = () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to create shorts',
        variant: 'destructive',
      });
      return;
    }
    setIsCreatorOpen(true);
  };

  const handleSaveShort = async (shortData: any) => {
    if (!user) return;

    try {
      let videoUrl = null;

      // Upload the video file if provided
      if (shortData.file) {
        videoUrl = await uploadMedia(shortData.file);
        if (!videoUrl) {
          throw new Error('Failed to upload video');
        }
      }

      const hashtagString = shortData.tags?.length > 0 
        ? '\n\n' + shortData.tags.map((tag: string) => `#${tag}`).join(' ') 
        : '';

      const { error } = await supabase
        .from('feed_posts')
        .insert({
          content: shortData.title + (shortData.description ? '\n\n' + shortData.description : '') + hashtagString,
          user_id: user.id,
          post_type: 'short',
          media_urls: videoUrl ? [videoUrl] : null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Short created successfully!',
      });
      
      fetchPosts();
      setIsCreatorOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
        fetchComments(postId);
      }
      return newSet;
    });
  };

  const addComment = async (postId: string) => {
    if (!user) {
      toast({ title: 'Please sign in to comment', variant: 'destructive' });
      return;
    }

    const commentContent = newComment[postId]?.trim();
    if (!commentContent) return;

    const { error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: commentContent
      });

    if (!error) {
      setNewComment(prev => ({ ...prev, [postId]: '' }));
      toast({ title: 'Comment added!' });
      fetchComments(postId);
      fetchPosts();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'startup': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'investor': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'mentor': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'advisor': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'student': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return null;
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <GuestPrompt 
          feature="Community Feed"
          description="Sign in to share posts, like content, and connect with the startup community."
        />
        <div className="opacity-50 pointer-events-none">
          <Card className="glass-morphism">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Preview: Sign in to see and create posts</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Shorts Carousel */}
      <ShortsCarousel onCreateShort={handleCreateShort} />

      {/* Create Post */}
      {showCreatePost && (
        <Card className="tech-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span>Share your journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What's happening in your startup journey? Share updates, insights, or ask for advice..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px] bg-background/50 border-primary/20 focus:border-primary"
            />
            
            {/* Media Preview */}
            {mediaPreview.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaPreview.map((preview, index) => (
                  <div key={index} className="relative group">
                    {mediaFiles[index].type.startsWith('video/') ? (
                      <video src={preview} className="w-full h-24 sm:h-32 object-cover rounded-lg" />
                    ) : (
                      <img src={preview} alt={`Preview ${index}`} className="w-full h-24 sm:h-32 object-cover rounded-lg" />
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex gap-1 sm:gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleMediaSelect}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleMediaSelect}
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Video</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleCreateShort}
                >
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Short</span>
                </Button>
              </div>
              <Button 
                onClick={createPost}
                disabled={loading || !newPost.trim()}
                className="pulse-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Posting...' : 'Share'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Grid */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="tech-card border-0 hover:scale-[1.01] transition-all">
            <CardContent className="p-4 sm:p-6">
              <div className="flex space-x-3 sm:space-x-4">
                <Avatar 
                  className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer hover:ring-2 ring-primary transition-all"
                  onClick={() => handleUserClick(post.user_id)}
                >
                  {post.profiles?.avatar_url ? (
                    <AvatarImage src={post.profiles.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {post.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <h3 
                          className="font-semibold text-sm sm:text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleUserClick(post.user_id)}
                        >
                          {post.profiles?.full_name || 'Anonymous User'}
                        </h3>
                        {post.user_role && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getRoleBadgeColor(post.user_role)}`}
                          >
                            {getRoleLabel(post.user_role)}
                          </Badge>
                        )}
                        <span className="text-muted-foreground">•</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  
                  <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                  
                  {/* Media Display */}
                  {post.media_urls && post.media_urls.length > 0 && (
                    <div className={`grid gap-2 mt-3 ${post.media_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {post.media_urls.filter(url => url).map((url, idx) => {
                        const isVideo = url?.includes('.mp4') || url?.includes('.webm') || url?.includes('.mov') || url?.includes('video');
                        return isVideo ? (
                          <video 
                            key={idx}
                            src={url} 
                            controls 
                            className="w-full rounded-lg max-h-64 sm:max-h-96 object-cover"
                          />
                        ) : (
                          <img 
                            key={idx}
                            src={url} 
                            alt={`Media ${idx + 1}`}
                            className="w-full rounded-lg max-h-64 sm:max-h-96 object-cover"
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="flex items-center flex-wrap gap-3 sm:gap-6 pt-3 border-t border-border">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-muted-foreground hover:text-primary px-2 ${
                        likedPosts.has(post.id) ? 'text-red-500' : ''
                      }`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <Heart className={`h-4 w-4 mr-1 sm:mr-2 ${
                        likedPosts.has(post.id) ? 'fill-current' : ''
                      }`} />
                      <span className="text-xs sm:text-sm">{post._count?.post_likes || 0}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-primary px-2"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">{post._count?.post_comments || 0}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-primary px-2"
                      onClick={() => sharePost(post.id, false)}
                    >
                      <Share className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm hidden sm:inline">Share</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-primary px-2"
                      onClick={() => sharePost(post.id, true)}
                    >
                      <Repeat2 className="h-4 w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm hidden sm:inline">Repost</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`text-muted-foreground hover:text-primary px-2 ${
                        bookmarkedPosts.has(post.id) ? 'text-primary' : ''
                      }`}
                      onClick={() => toggleBookmark(post.id)}
                    >
                      <Bookmark className={`h-4 w-4 ${
                        bookmarkedPosts.has(post.id) ? 'fill-current' : ''
                      }`} />
                    </Button>
                    
                    {user?.id === post.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive px-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete post?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your post.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePost(post.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>

                  {/* Comments Section - Always show first 2 comments */}
                  {(post._count?.post_comments || 0) > 0 && (
                    <div className="space-y-3 sm:space-y-4 pt-4 border-t border-border mt-4">
                      {/* Show first 2 comments as preview */}
                      {!expandedComments.has(post.id) && post.post_comments && (
                        <div className="space-y-3">
                          {post.post_comments.slice(0, 2).map((comment) => (
                            <div key={comment.id} className="flex gap-2 sm:gap-3">
                              <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                                  {comment.profiles?.full_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                  <p className="text-xs sm:text-sm font-semibold truncate">{comment.profiles?.full_name || 'Anonymous'}</p>
                                  <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                                </div>
                                <p className="text-xs sm:text-sm break-words">{comment.content}</p>
                              </div>
                            </div>
                          ))}
                          
                          {(post._count?.post_comments || 0) > 2 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-xs text-muted-foreground hover:text-primary"
                              onClick={() => toggleComments(post.id)}
                            >
                              View all {post._count?.post_comments} comments
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Show all comments when expanded */}
                      {expandedComments.has(post.id) && (
                        <>
                          <div className="space-y-3">
                            {comments[post.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-2 sm:gap-3">
                                <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
                                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                                    {comment.profiles?.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1 min-w-0">
                                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <p className="text-xs sm:text-sm font-semibold truncate">{comment.profiles?.full_name || 'Anonymous'}</p>
                                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm break-words">{comment.content}</p>
                                </div>
                              </div>
                            ))}
                            
                            {(post._count?.post_comments || 0) > 2 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-muted-foreground hover:text-primary"
                                onClick={() => toggleComments(post.id)}
                              >
                                Show less
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                      
                      {/* Add comment input - always visible */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addComment(post.id);
                            }
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button onClick={() => addComment(post.id)} size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Show add comment input even if no comments yet */}
                  {(post._count?.post_comments || 0) === 0 && expandedComments.has(post.id) && (
                    <div className="space-y-3 sm:space-y-4 pt-4 border-t border-border mt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Be the first to comment..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addComment(post.id);
                            }
                          }}
                          className="flex-1 text-sm"
                        />
                        <Button onClick={() => addComment(post.id)} size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Infinite Scroll Trigger */}
        {hasMore && posts.length > 0 && (
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading more posts...</span>
              </div>
            )}
          </div>
        )}
        
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>You've reached the end of the feed</p>
          </div>
        )}
      </div>

      {posts.length === 0 && !loading && (
        <Card className="tech-card border-0 text-center p-8 sm:p-12">
          <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Be the first to share your startup journey!</p>
        </Card>
      )}

      {/* Shorts Creator Modal */}
      <ShortsCreator 
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSave={handleSaveShort}
      />

      {/* User Profile Dialog */}
      <UserProfileDialog
        userId={selectedUserId}
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
      />
    </div>
  );
}
