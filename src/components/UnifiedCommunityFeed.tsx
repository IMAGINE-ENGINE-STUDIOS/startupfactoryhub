import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share, Plus, Zap, TrendingUp, Users, Bookmark, Repeat2, Send, Calendar, Image as ImageIcon, Video, Sparkles, X, Trash2, Hash, Trophy, ZoomIn, Wand2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import ShortsCarousel from '@/components/ShortsCarousel';
import ShortsCreator from '@/components/ShortsCreator';
import GuestPrompt from '@/components/GuestPrompt';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';
import OfficialBadge from './OfficialBadge';
import UserProfileDialog from '@/components/UserProfileDialog';
import { CohortPostCard } from '@/components/CohortPostCard';
import LiveRoomPostCard from '@/components/LiveRoomPostCard';
import { EventPostCard } from '@/components/EventPostCard';
import { FeedPostCard } from '@/components/FeedPostCard';
import LinkedInShareDialog from '@/components/LinkedInShareDialog';
import ImageLightbox from '@/components/ImageLightbox';
import { Linkedin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import geniusAiLogo from "@/assets/imaginaly-logo.png";
import { UniversalFileUploader, type UploadedFile } from '@/components/upload/UniversalFileUploader';
import { FileAttachmentPreview } from '@/components/upload/FileAttachmentPreview';
import { getFileKind } from '@/lib/upload/fileKinds';
import { Paperclip } from 'lucide-react';
import { useMembershipPrompt } from '@/features/basic-plan/components/MembershipGate';

interface FeedPost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_type: string;
  internship_data?: any;
  cohort_data?: any;
  room_data?: { room_id: string; meeting_link: string } | any;
  event_data?: {
    event_id: string;
    title: string;
    description?: string;
    start_date: string;
    end_date?: string;
    location?: string;
    is_virtual?: boolean;
    banner_url?: string;
    max_attendees?: number;
    external_registration_url?: string;
    ticket_price_cents?: number;
    is_paid?: boolean;
  } | null;
  media_urls?: string[] | null;
  shared_post_id?: string | null;
  profiles?: {
    full_name: string;
    avatar_url?: string;
    is_official_mentor?: boolean;
  } | null;
  user_role?: string | null;
  company_name?: string | null;
  post_likes: {
    user_id: string;
  }[];
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
  interstitialContent?: React.ReactNode;
  interstitialAfterIndex?: number;
}
export default function UnifiedCommunityFeed({
  showCreatePost = true,
  limit = 10,
  interstitialContent,
  interstitialAfterIndex = 3
}: UnifiedCommunityFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const { requireMembership, dialog: membershipDialog } = useMembershipPrompt('Social feed posting');
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreview, setMediaPreview] = useState<string[]>([]);
  const [showUploader, setShowUploader] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);

  const [postHashtags, setPostHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [newShortForCarousel, setNewShortForCarousel] = useState<any>(null);
  const [linkedInShareOpen, setLinkedInShareOpen] = useState(false);
  const [linkedInShareContent, setLinkedInShareContent] = useState('');
  const [linkedInShareImage, setLinkedInShareImage] = useState<string | undefined>();
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showImaginalyDialog, setShowImaginalyDialog] = useState(false);
  const [imaginalyPrompt, setImaginalyPrompt] = useState('');
  const [imaginalyGenerating, setImaginalyGenerating] = useState(false);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
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
  const openLinkedInShare = (post: FeedPost) => {
    setLinkedInShareContent(post.content || '');
    setLinkedInShareImage(post.media_urls?.[0] || undefined);
    setLinkedInShareOpen(true);
  };
  useEffect(() => {
    fetchPosts();
    if (user) {
      fetchUserLikes();
      fetchUserBookmarks();
      // Check if current user is admin
      supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle().then(({ data }) => {
        setIsAdmin(!!data);
      });
    }

    // Set up real-time subscription
    const channel = supabase.channel('feed-posts').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'feed_posts'
    }, () => fetchPosts()).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'post_likes'
    }, () => {
      fetchPosts();
      if (user) fetchUserLikes();
    }).on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'post_likes'
    }, () => {
      fetchPosts();
      if (user) fetchUserLikes();
    }).on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'post_comments'
    }, () => fetchPosts()).on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'feed_posts'
    }, payload => {
      setPosts(posts => posts.filter(post => post.id !== payload.old.id));
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchPosts(true);
      }
    }, {
      threshold: 0.1
    });
    observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, offset]);
  const formatPostBatch = async (rawPosts: any[]): Promise<FeedPost[]> => {
    if (!rawPosts?.length) return [];

    const userIds = [...new Set(rawPosts.map(post => post.user_id).filter(Boolean))];
    const commentUserIds = [...new Set(rawPosts.flatMap(post => post.post_comments?.map((comment: any) => comment.user_id) || []).filter(Boolean))];
    const allUserIds = [...new Set([...userIds, ...commentUserIds])];

    const [{ data: profilesData }, { data: rolesData }, { data: companiesData }] = await Promise.all([
      supabase.from('profiles').select('user_id, full_name, avatar_url, is_official_mentor').in('user_id', allUserIds),
      supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
      supabase.from('companies').select('user_id, name').in('user_id', userIds)
    ]);

    const eventPostIds = rawPosts
      .filter(post => post.post_type === 'event' && (post.internship_data as any)?.event_id)
      .map(post => (post.internship_data as any).event_id);

    let eventsMap: Record<string, any> = {};
    if (eventPostIds.length > 0) {
      const { data: eventsData } = await supabase
        .from('events')
        .select('id, title, description, start_date, end_date, location, is_virtual, banner_url, max_attendees')
        .in('id', eventPostIds);

      eventsMap = (eventsData || []).reduce((acc, event) => {
        acc[event.id] = event;
        return acc;
      }, {} as Record<string, any>);
    }

    const profilesMap = (profilesData || []).reduce((acc, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {} as Record<string, any>);
    const rolesMap = (rolesData || []).reduce((acc, roleEntry) => {
      acc[roleEntry.user_id] = roleEntry.role;
      return acc;
    }, {} as Record<string, string>);
    const companiesMap = (companiesData || []).reduce((acc, company) => {
      acc[company.user_id] = company.name;
      return acc;
    }, {} as Record<string, string>);

    return rawPosts.map(post => {
      let event_data = null;
      const internshipData = post.internship_data as any;
      if (post.post_type === 'event' && internshipData?.event_id) {
        const eventInfo = eventsMap[internshipData.event_id];
        if (eventInfo) {
          event_data = {
            event_id: eventInfo.id,
            title: eventInfo.title,
            description: eventInfo.description,
            start_date: eventInfo.start_date,
            end_date: eventInfo.end_date,
            location: eventInfo.location,
            is_virtual: eventInfo.is_virtual,
            banner_url: eventInfo.banner_url,
            max_attendees: eventInfo.max_attendees,
            external_registration_url: eventInfo.external_registration_url,
            ticket_price_cents: eventInfo.ticket_price_cents,
            is_paid: eventInfo.is_paid,
          };
        }
      }

      return {
        ...post,
        profiles: profilesMap[post.user_id] || null,
        user_role: rolesMap[post.user_id] || null,
        company_name: companiesMap[post.user_id] || null,
        event_data,
        post_comments: (post.post_comments || []).map((comment: any) => ({
          ...comment,
          profiles: profilesMap[comment.user_id] || null
        })),
        _count: {
          post_likes: post.post_likes?.length || 0,
          post_comments: post.post_comments?.length || 0
        }
      };
    });
  };

  const fetchPosts = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true);
    }
    const currentOffset = loadMore ? offset : 0;
    let {
      data: postsData,
      error: postsError
    } = await supabase.from('feed_posts').select(`
        *,
        post_likes (user_id),
        post_comments (
          id,
          content,
          created_at,
          user_id,
          parent_comment_id
        )
      `).neq('post_type', 'short').order('created_at', {
      ascending: false
    }).range(currentOffset, currentOffset + limit - 1);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setLoadingMore(false);
      return;
    }

    if ((postsData || []).length < limit) {
      setHasMore(false);
    }

    const formattedPosts = await formatPostBatch(postsData || []);

    if (loadMore) {
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = formattedPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
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
    const {
      data
    } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id);
    if (data) {
      setLikedPosts(new Set(data.map(like => like.post_id)));
    }
  };
  const fetchUserBookmarks = async () => {
    if (!user) return;
    const {
      data
    } = await supabase.from('post_bookmarks').select('post_id').eq('user_id', user.id);
    if (data) {
      setBookmarkedPosts(new Set(data.map(bookmark => bookmark.post_id)));
    }
  };
  const fetchComments = async (postId: string) => {
    const {
      data,
      error
    } = await supabase.from('post_comments').select('*, profiles:user_id(full_name, avatar_url)').eq('post_id', postId).order('created_at', {
      ascending: true
    });
    if (!error && data) {
      setComments(prev => ({
        ...prev,
        [postId]: data
      }));
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
  const uploadMedia = async (file: File, retries = 3): Promise<string | null> => {
    try {
      // Check file size before upload
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Video must be under 500MB. Your file is ' + (file.size / (1024 * 1024)).toFixed(2) + 'MB',
          variant: 'destructive'
        });
        throw new Error('File size exceeds 500MB limit');
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user!.id}/${fileName}`;
      console.log('[Upload] Starting upload:', {
        fileName,
        fileSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
        fileType: file.type
      });

      // Upload with timeout
      const uploadPromise = supabase.storage.from('feed-media').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      // Add 5 minute timeout
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timeout after 5 minutes')), 300000));
      const {
        data: uploadData,
        error: uploadError
      } = (await Promise.race([uploadPromise, timeoutPromise])) as any;
      if (uploadError) {
        console.error('[Upload] Upload error:', uploadError);

        // Retry on network errors
        if (retries > 0 && (uploadError.message.includes('network') || uploadError.message.includes('timeout'))) {
          console.log(`[Upload] Retrying upload... (${retries} attempts left)`);
          toast({
            title: 'Retrying upload...',
            description: `Network issue detected. Retrying... (${retries} attempts left)`
          });
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          return uploadMedia(file, retries - 1);
        }
        let errorMsg = uploadError.message;
        if (uploadError.message.includes('quota')) {
          errorMsg = 'Storage quota exceeded. Please contact support.';
        } else if (uploadError.message.includes('size')) {
          errorMsg = 'File too large. Maximum size is 500MB.';
        } else if (uploadError.message.includes('network') || uploadError.message.includes('timeout')) {
          errorMsg = 'Network error. Check your connection and try again.';
        }
        toast({
          title: 'Upload Failed',
          description: errorMsg,
          variant: 'destructive'
        });
        throw uploadError;
      }
      console.log('[Upload] Upload successful, getting public URL');
      const {
        data
      } = supabase.storage.from('feed-media').getPublicUrl(filePath);
      if (!data.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      console.log('[Upload] Public URL obtained successfully');
      return data.publicUrl;
    } catch (error: any) {
      console.error('[Upload] Error uploading file:', error);
      if (error.message === 'File size exceeds 500MB limit') {
        throw error;
      }
      toast({
        title: 'Upload Error',
        description: error.message || 'Failed to upload video. Please try again.',
        variant: 'destructive'
      });
      return null;
    }
  };
  const createPost = async () => {
    if (!requireMembership()) return;
    if (!newPost.trim() || !user) {
      if (!user) {
        toast({
          title: 'Sign In Required',
          description: 'Please sign in to create posts',
          variant: 'destructive'
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
      // Universal uploader attachments (already uploaded: any file type)
      attachedFiles.forEach(f => mediaUrls.push(f.url));
      const hashtagString = postHashtags.length > 0 ? '\n\n' + postHashtags.map(tag => `#${tag}`).join(' ') : '';
      const {
        error
      } = await supabase.from('feed_posts').insert({
        content: newPost + hashtagString,
        user_id: user.id,
        post_type: 'update',
        media_urls: mediaUrls.length > 0 ? mediaUrls : null
      });
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Post created successfully!'
      });
      setNewPost('');
      setMediaFiles([]);
      setMediaPreview([]);
      setAttachedFiles([]);
      setShowUploader(false);
      setPostHashtags([]);
      setNewHashtag('');

      fetchPosts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Please sign in to like posts',
        variant: 'destructive'
      });
      return;
    }
    const isLiked = likedPosts.has(postId);

    // Optimistic UI: reflect the new like count immediately, before the
    // network round-trip / realtime event arrives.
    const applyDelta = (delta: number) => {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        _count: {
          ...(p._count || {}),
          post_likes: Math.max(0, ((p._count?.post_likes as number) || 0) + delta)
        }
      } : p));
    };

    if (isLiked) {
      applyDelta(-1);
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      applyDelta(1);
      setLikedPosts(prev => new Set([...prev, postId]));
    }

    if (isLiked) {
      const {
        error
      } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      if (error) {
        // rollback
        applyDelta(1);
        setLikedPosts(prev => new Set([...prev, postId]));
      }
    } else {
      const {
        error
      } = await supabase.from('post_likes').insert({
        post_id: postId,
        user_id: user.id
      });
      if (error) {
        // rollback
        applyDelta(-1);
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    }
  };
  const toggleBookmark = async (postId: string) => {
    if (!user) {
      toast({
        title: 'Please sign in to bookmark posts',
        variant: 'destructive'
      });
      return;
    }
    const isBookmarked = bookmarkedPosts.has(postId);
    if (isBookmarked) {
      const {
        error
      } = await supabase.from('post_bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
      if (!error) {
        setBookmarkedPosts(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
        toast({
          title: 'Bookmark removed'
        });
      }
    } else {
      const {
        error
      } = await supabase.from('post_bookmarks').insert({
        post_id: postId,
        user_id: user.id
      });
      if (!error) {
        setBookmarkedPosts(prev => new Set([...prev, postId]));
        toast({
          title: 'Post bookmarked!'
        });
      }
    }
  };
  const deletePost = async (postId: string) => {
    if (!user) return;
    try {
      if (isAdmin) {
        // Admin: use edge function for permanent deletion (bypasses RLS)
        const { data, error } = await supabase.functions.invoke('admin-delete-feed-post', {
          body: { postId }
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else {
        // Regular user: can only delete own posts
        const { error } = await supabase.from('feed_posts').delete().eq('id', postId).eq('user_id', user.id);
        if (error) throw error;
      }
      setPosts(posts.filter(p => p.id !== postId));
      toast({
        title: 'Post deleted',
        description: isAdmin ? 'Post has been permanently deleted' : 'Your post has been deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        variant: 'destructive'
      });
    }
  };
  const sharePost = async (postId: string, isRepost: boolean = false) => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to share posts',
        variant: 'destructive'
      });
      return;
    }
    try {
      if (isRepost) {
        const originalPost = posts.find(p => p.id === postId);
        if (!originalPost) return;
        const {
          error
        } = await supabase.from('feed_posts').insert({
          content: `Reposted: ${originalPost.content}`,
          user_id: user.id,
          post_type: 'update',
          shared_post_id: postId,
          media_urls: originalPost.media_urls
        });
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Post reposted successfully!'
        });
        fetchPosts();
      } else {
        const url = `${window.location.origin}/post/${postId}`;
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Success',
          description: 'Post link copied to clipboard!'
        });
        // Also prompt LinkedIn sharing
        const post = posts.find(p => p.id === postId);
        if (post) {
          openLinkedInShare(post);
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share post',
        variant: 'destructive'
      });
    }
  };
  const handleCreateShort = () => {
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to create shorts',
        variant: 'destructive'
      });
      return;
    }
    setIsCreatorOpen(true);
  };
  const handleSaveShort = async (shortData: any) => {
    if (!user) return;
    try {
      // Show uploading toast
      toast({
        title: 'Uploading...',
        description: 'Creating your short video'
      });
      let videoUrl = null;

      // Upload the video file if provided
      if (shortData.file) {
        videoUrl = await uploadMedia(shortData.file);
        if (!videoUrl) {
          throw new Error('Failed to upload video');
        }
      }
      const hashtagString = shortData.tags?.length > 0 ? '\n\n' + shortData.tags.map((tag: string) => `#${tag}`).join(' ') : '';
      const content = shortData.title + (shortData.description ? '\n\n' + shortData.description : '') + hashtagString;
      const {
        data: newPost,
        error
      } = await supabase.from('feed_posts').insert({
        content,
        user_id: user.id,
        post_type: 'short',
        media_urls: videoUrl ? [videoUrl] : null
      }).select('id, content, user_id, media_urls, likes_count, comments_count, created_at').single();
      if (error) throw error;

      // Fetch user profile separately
      const {
        data: profileData
      } = await supabase.from('profiles').select('user_id, full_name, avatar_url').eq('user_id', user.id).single();

      // Immediately show the new short in the carousel
      if (newPost && videoUrl) {
        const newShort = {
          id: newPost.id,
          video_url: videoUrl,
          content: newPost.content,
          user_id: newPost.user_id,
          profiles: profileData,
          likes_count: newPost.likes_count || 0,
          comments_count: newPost.comments_count || 0,
          created_at: newPost.created_at
        };

        // Trigger carousel update by setting state
        setNewShortForCarousel(newShort);

        // Clear after a moment to allow for next short
        setTimeout(() => setNewShortForCarousel(null), 1000);
      }
      toast({
        title: 'Success',
        description: 'Short created successfully!'
      });
      fetchPosts();
      setIsCreatorOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
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
      toast({
        title: 'Please sign in to comment',
        variant: 'destructive'
      });
      return;
    }
    const commentContent = newComment[postId]?.trim();
    if (!commentContent) {
      toast({
        title: 'Comment cannot be empty',
        variant: 'destructive'
      });
      return;
    }
    console.log('Adding comment to post:', postId, 'Content:', commentContent);
    const {
      error
    } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: commentContent
    });
    if (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Failed to add comment',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));
      toast({
        title: 'Comment added!'
      });
      fetchComments(postId);
      fetchPosts();
    }
  };
  const addReply = async (postId: string, parentCommentId: string, content: string) => {
    if (!user) {
      toast({
        title: 'Please sign in to reply',
        variant: 'destructive'
      });
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      toast({
        title: 'Reply cannot be empty',
        variant: 'destructive'
      });
      return;
    }
    const {
      error
    } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: trimmed,
      parent_comment_id: parentCommentId
    });
    if (error) {
      console.error('Error adding reply:', error);
      toast({
        title: 'Failed to add reply',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Reply added!'
      });
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
      case 'startup':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'investor':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'mentor':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'advisor':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'student':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'accelerator':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  const getRoleLabel = (role: string | null) => {
    if (!role) return null;
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  if (!user) {
    return <div className="space-y-6">
        <GuestPrompt feature="Community Feed" description="Sign in to share posts, like content, and connect with the startup community." />
        <div className="opacity-50 pointer-events-none">
          <Card className="glass-morphism">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Preview: Sign in to see and create posts</p>
            </CardContent>
          </Card>
        </div>
      </div>;
  }
  return <div className="space-y-4 sm:space-y-6">
      {membershipDialog}

      {/* Shorts Carousel */}
      <ShortsCarousel onCreateShort={handleCreateShort} newShort={newShortForCarousel} />

      {/* Community Districts interstitial */}
      {interstitialContent}

      {/* Create Post */}
      {showCreatePost && <div className="relative group">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 rounded-xl blur-sm opacity-60 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />
          <Card data-tour="composer" className="relative tech-card border-0 backdrop-blur-2xl overflow-hidden">
            <div className="absolute top-0 left-0 h-px w-24 bg-gradient-to-r from-primary/80 to-transparent" />
            <div className="absolute bottom-0 right-0 h-px w-24 bg-gradient-to-l from-accent/80 to-transparent" />
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <div className="flex items-center space-x-2">
                <span>Post about your Journey or Opportunities&nbsp;</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                Uplink · Active
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Broadcast to the district — share updates, insights, or ask for advice..." value={newPost} onChange={e => setNewPost(e.target.value)} className="min-h-[100px] bg-background/40 border-primary/20 focus:border-primary backdrop-blur-xl" />

            
            {/* Media Preview */}
            {mediaPreview.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {mediaPreview.map((preview, index) => <div key={index} className="relative group">
                    {mediaFiles[index].type.startsWith('video/') ? <video src={preview} className="w-full h-24 sm:h-32 object-cover rounded-lg" /> : <img src={preview} alt={`Preview ${index}`} className="w-full h-24 sm:h-32 object-cover rounded-lg" />}
                    <Button variant="destructive" size="sm" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeMedia(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>)}
              </div>}

            {/* Universal file uploader — any file type (3D/AR, docs, data, media) */}
            {showUploader && (
              <UniversalFileUploader
                folder="feed"
                maxFiles={10}
                maxSizeMB={500}
                compact
                onUploaded={files => setAttachedFiles(prev => [...prev, ...files])}
                onRemoved={file => setAttachedFiles(prev => prev.filter(f => f.path !== file.path))}
              />
            )}


            {/* Hashtags Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input value={newHashtag} onChange={e => setNewHashtag(e.target.value)} placeholder="Add hashtags (optional)" className="pl-10" onKeyPress={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newHashtag.trim() && postHashtags.length < 10) {
                    setPostHashtags([...postHashtags, newHashtag.trim().replace(/^#/, '')]);
                    setNewHashtag('');
                  }
                }
              }} />
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => {
              if (newHashtag.trim() && postHashtags.length < 10) {
                setPostHashtags([...postHashtags, newHashtag.trim().replace(/^#/, '')]);
                setNewHashtag('');
              }
            }}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {postHashtags.length > 0 && <div className="flex flex-wrap gap-2">
                  {postHashtags.map((tag, index) => <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      #{tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setPostHashtags(postHashtags.filter((_, i) => i !== index))} />
                    </Badge>)}
                </div>}
            </div>

            <div className="flex flex-wrap justify-between items-center gap-2">
              <div className="flex gap-1 sm:gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaSelect} />
                <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleMediaSelect} />
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => videoInputRef.current?.click()}>
                  <Video className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Video</span>
                </Button>
                <Button variant={showUploader ? 'secondary' : 'ghost'} size="sm" onClick={() => setShowUploader(v => !v)}>
                  <Paperclip className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Files{attachedFiles.length > 0 ? ` (${attachedFiles.length})` : ''}</span>
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setShowImaginalyDialog(true)}>
                  <img src={geniusAiLogo} alt="Imaginaly" className="h-4 w-4 object-contain sm:mr-2" />
                  <span className="hidden sm:inline">Imaginaly</span>
                </Button>
              </div>
              <Button onClick={createPost} disabled={loading || !newPost.trim()} className="pulse-primary bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-[0_0_20px_hsl(var(--primary)/0.4)] text-primary-foreground font-bold tracking-widest uppercase text-xs">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Transmitting...' : 'Transmit'}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>}


      {/* Posts Grid */}
      <div className="space-y-4">
        {posts.map((post, index) => {
        const isJourneyCompletion = post.post_type === 'journey_completion';
        const isCohortPost = post.post_type === 'cohort' && post.cohort_data;
        const isLiveRoomPost = post.post_type === 'live_room' && post.room_data;
        const isEventPost = post.post_type === 'event' && post.event_data;
        
        // Render live room posts with special LiveRoomPostCard (same format as CohortPostCard)
        if (isLiveRoomPost) {
          return (
            <LiveRoomPostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                created_at: post.created_at,
                user_id: post.user_id,
                room_data: post.room_data,
                profiles: post.profiles
              }}
              isLiked={likedPosts.has(post.id)}
              isBookmarked={bookmarkedPosts.has(post.id)}
              likesCount={post._count?.post_likes || 0}
              commentsCount={post._count?.post_comments || 0}
              onLike={() => toggleLike(post.id)}
              onBookmark={() => toggleBookmark(post.id)}
              onComment={() => toggleComments(post.id)}
              onShare={() => sharePost(post.id, false)}
              onUserClick={handleUserClick}
            />
          );
        }
        
        // Render cohort posts with special CohortPostCard
        if (isCohortPost) {
          return (
            <CohortPostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                created_at: post.created_at,
                user_id: post.user_id,
                cohort_data: post.cohort_data,
                profiles: post.profiles
              }}
              isLiked={likedPosts.has(post.id)}
              isBookmarked={bookmarkedPosts.has(post.id)}
              likesCount={post._count?.post_likes || 0}
              commentsCount={post._count?.post_comments || 0}
              onLike={() => toggleLike(post.id)}
              onBookmark={() => toggleBookmark(post.id)}
              onComment={() => toggleComments(post.id)}
              onShare={() => sharePost(post.id, false)}
              onUserClick={handleUserClick}
            />
          );
        }

        // Render event posts with special EventPostCard
        if (isEventPost) {
          return (
            <EventPostCard
              key={post.id}
              post={{
                id: post.id,
                content: post.content,
                created_at: post.created_at,
                user_id: post.user_id,
                event_data: post.event_data!,
                media_urls: post.media_urls,
                profiles: post.profiles,
                company_name: post.company_name
              }}
              isLiked={likedPosts.has(post.id)}
              isBookmarked={bookmarkedPosts.has(post.id)}
              likesCount={post._count?.post_likes || 0}
              commentsCount={post._count?.post_comments || 0}
              onLike={() => toggleLike(post.id)}
              onBookmark={() => toggleBookmark(post.id)}
              onComment={() => toggleComments(post.id)}
              onShare={() => sharePost(post.id, false)}
              onUserClick={handleUserClick}
            />
          );
        }

        return isJourneyCompletion ? <motion.div key={post.id} initial={{
          scale: 0.95,
          opacity: 0
        }} animate={{
          scale: 1,
          opacity: 1
        }} transition={{
          duration: 0.5
        }} className="relative">
              {/* Gradient border effect */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-lg opacity-75 blur" />
              
              <Card className="relative tech-card border-2 border-yellow-400">
                {/* Trophy badge header */}
                <div className="bg-gradient-to-r from-yellow-50 to-pink-50 dark:from-yellow-950/50 dark:to-pink-950/50 px-3 sm:px-4 py-2 border-b grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="min-w-0 truncate text-xs sm:text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                    Journey Complete - Celebrate This Milestone!
                  </span>
                  <div className="pointer-events-none h-8 w-8 shrink-0 relative isolate overflow-visible">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ background: 'conic-gradient(from 0deg, transparent, #eab308, #f59e0b, transparent)' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-amber-500/40 blur-lg"
                      animate={{ opacity: [0.4, 0.9, 0.4], scale: [0.9, 1.15, 0.9] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center border border-white/10">
                      <Trophy className="h-4 w-4 text-amber-300" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4 sm:p-6">
                  <div className="flex space-x-3 sm:space-x-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 cursor-pointer hover:ring-2 ring-primary transition-all" onClick={() => handleUserClick(post.user_id)}>
                        {post.profiles?.avatar_url ? <AvatarImage src={post.profiles.avatar_url} /> : null}
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {post.profiles?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <OnlineStatusIndicator userId={post.user_id} size="sm" className="absolute bottom-0 right-0" />
                    </div>
                    
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors" onClick={() => handleUserClick(post.user_id)}>
                            {post.profiles?.full_name || 'Anonymous User'}
                          </h3>
                          {post.profiles?.is_official_mentor && <OfficialBadge size="sm" role={post.user_role || undefined} />}
                          {post.user_role && <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(post.user_role)}`}>
                              {getRoleLabel(post.user_role)}
                            </Badge>}
                          <span className="text-muted-foreground">•</span>
                          <span className="text-xs sm:text-sm text-muted-foreground">{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    
                      <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>
                      
                      {/* Media Display */}
                      {post.media_urls && post.media_urls.length > 0 && (() => {
                        const urls = post.media_urls!.filter(Boolean);
                        const imageUrls = urls.filter(url => getFileKind(url) === 'image');
                        const videoUrls = urls.filter(url => getFileKind(url) === 'video');
                        const otherUrls = urls.filter(url => !['image', 'video'].includes(getFileKind(url)));
                        return (
                          <div className={`grid gap-2 mt-3 ${urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {videoUrls.map((url, idx) => (
                              <video key={`v-${idx}`} src={url} controls className="w-full rounded-lg max-h-64 sm:max-h-96 object-cover" />
                            ))}
                            {imageUrls.map((url, idx) => (
                              <div key={`i-${idx}`} className="relative cursor-pointer group" onClick={() => openLightbox(imageUrls, idx)}>
                                <img src={url} alt={`Media ${idx + 1}`} className="w-full rounded-lg max-h-64 sm:max-h-96 object-cover transition-transform group-hover:brightness-90" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="bg-black/50 rounded-full p-2">
                                    <ZoomIn className="h-5 w-5 text-white" />
                                  </div>
                                </div>
                                {imageUrls.length > 1 && idx === 0 && (
                                  <Badge className="absolute top-2 right-2 bg-black/60 text-white border-none text-xs">
                                    1/{imageUrls.length}
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {otherUrls.map((url, idx) => (
                              <FileAttachmentPreview key={`f-${idx}`} url={url} />
                            ))}
                          </div>
                        );
                      })()}

                      
                      <div className="flex items-center flex-wrap gap-3 sm:gap-6 pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className={`text-muted-foreground hover:text-primary px-2 ${likedPosts.has(post.id) ? 'text-red-500' : ''}`} onClick={() => toggleLike(post.id)}>
                          <Heart className={`h-4 w-4 mr-1 sm:mr-2 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                          <span className="text-xs sm:text-sm">{post._count?.post_likes || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2" onClick={() => toggleComments(post.id)}>
                          <MessageCircle className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm">{post._count?.post_comments || 0}</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2" onClick={() => sharePost(post.id, false)}>
                          <Share className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm hidden sm:inline">Share</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2" onClick={() => sharePost(post.id, true)}>
                          <Repeat2 className="h-4 w-4 mr-1 sm:mr-2" />
                          <span className="text-xs sm:text-sm hidden sm:inline">Repost</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[#0077B5] px-2" onClick={() => openLinkedInShare(post)} title="Share to LinkedIn">
                          <Linkedin className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className={`text-muted-foreground hover:text-primary px-2 ml-auto ${bookmarkedPosts.has(post.id) ? 'text-primary' : ''}`} onClick={() => toggleBookmark(post.id)}>
                          <Bookmark className={`h-4 w-4 ${bookmarkedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        </Button>
                        {(post.user_id === user?.id || isAdmin) && <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive px-2">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {isAdmin && post.user_id !== user?.id 
                                    ? 'You are deleting this post as an admin. This will permanently remove the post and all associated media.'
                                    : 'Are you sure you want to delete this post? This action cannot be undone.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePost(post.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>}
                      </div>
                      
                      {/* Comments Section */}
                      {expandedComments.has(post.id) && <div className="space-y-3 mt-4">
                          {comments[post.id] && comments[post.id].length > 0 ? comments[post.id].map((comment: any) => <div key={comment.id} className="flex gap-2 sm:gap-3 pl-0 sm:pl-4">
                                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                                  {comment.profiles?.avatar_url ? <AvatarImage src={comment.profiles.avatar_url} /> : null}
                                  <AvatarFallback className="text-xs bg-gradient-primary text-primary-foreground">
                                    {comment.profiles?.full_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted/30 rounded-lg px-3 py-2">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-xs sm:text-sm font-medium text-foreground">
                                      {comment.profiles?.full_name || 'Anonymous'}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(comment.created_at)}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-foreground break-words">{comment.content}</p>
                                </div>
                              </div>) : <p className="text-sm text-muted-foreground pl-0 sm:pl-4">No comments yet. Be the first!</p>}
                          {comments[post.id] && comments[post.id].length > 3 && <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" onClick={() => toggleComments(post.id)}>
                              Show less
                            </Button>}
                        </div>}
                      
                      {/* Add comment input - ALWAYS visible */}
                      <div className="flex gap-2">
                        <Input placeholder={(post._count?.post_comments || 0) === 0 ? "Be the first to comment..." : "Write a comment..."} value={newComment[post.id] || ''} onChange={e => setNewComment(prev => ({
                      ...prev,
                      [post.id]: e.target.value
                    }))} onKeyPress={e => {
                      if (e.key === 'Enter') {
                        addComment(post.id);
                      }
                    }} className="flex-1 text-sm" />
                        <Button onClick={() => addComment(post.id)} size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
              </Card>
            </motion.div>
            : <FeedPostCard
                key={post.id}
                post={post}
                isLiked={likedPosts.has(post.id)}
                isBookmarked={bookmarkedPosts.has(post.id)}
                likesCount={post._count?.post_likes || 0}
                commentsCount={post._count?.post_comments || 0}
                comments={comments[post.id] || []}
                expandedComments={expandedComments.has(post.id)}
                newComment={newComment[post.id] || ''}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                onLike={() => toggleLike(post.id)}
                onBookmark={() => toggleBookmark(post.id)}
                onComment={() => toggleComments(post.id)}
                onShare={() => sharePost(post.id, false)}
                onRepost={() => sharePost(post.id, true)}
                onLinkedInShare={() => openLinkedInShare(post)}
                onDelete={() => deletePost(post.id)}
                onUserClick={handleUserClick}
                onCommentChange={(value) => setNewComment(prev => ({ ...prev, [post.id]: value }))}
                onCommentSubmit={() => addComment(post.id)}
                onReplySubmit={(parentId, content) => addReply(post.id, parentId, content)}
                onImageClick={(urls, idx) => openLightbox(urls, idx)}
              />;
      })}
        
        
        {/* Infinite Scroll Trigger */}
        {hasMore && posts.length > 0 && <div ref={loadMoreRef} className="py-8 flex justify-center">
            {loadingMore && <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Loading more posts...</span>
              </div>}
          </div>}
        
        {!hasMore && posts.length > 0 && <div className="text-center py-8 text-muted-foreground">
            <p>You've reached the end of the feed</p>
          </div>}
      </div>

      {posts.length === 0 && !loading && <Card className="tech-card border-0 text-center p-8 sm:p-12">
          <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground">Be the first to share your startup journey!</p>
        </Card>}

      {/* Shorts Creator Modal */}
      <ShortsCreator isOpen={isCreatorOpen} onClose={() => setIsCreatorOpen(false)} onSave={handleSaveShort} />

      {/* User Profile Dialog */}
      <UserProfileDialog userId={selectedUserId} open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />

      {/* LinkedIn Share Dialog */}
      <LinkedInShareDialog
        open={linkedInShareOpen}
        onOpenChange={setLinkedInShareOpen}
        postContent={linkedInShareContent}
        postImageUrl={linkedInShareImage}
      />

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      {/* Imaginaly Quick Generator */}
      <Dialog open={showImaginalyDialog} onOpenChange={setShowImaginalyDialog}>
        <DialogContent className="tech-card border-0 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={geniusAiLogo} alt="Imaginaly" className="h-5 w-5 object-contain" />
              Imaginaly
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Describe the image you want to generate..."
              value={imaginalyPrompt}
              onChange={(e) => setImaginalyPrompt(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              disabled={imaginalyGenerating}
            />
            <Button
              onClick={async () => {
                if (!imaginalyPrompt.trim()) return;
                setImaginalyGenerating(true);
                try {
                  const { data, error } = await supabase.functions.invoke("generate-sfh-image", {
                    body: { prompt: imaginalyPrompt.trim(), stylePreset: "none" },
                  });
                  if (error) throw new Error(String(error.message || error));
                  if (data?.error) throw new Error(data.error);
                  // Fetch the generated image as a File and add to media
                  const resp = await fetch(data.imageUrl);
                  const blob = await resp.blob();
                  const file = new File([blob], `imaginaly-${Date.now()}.png`, { type: "image/png" });
                  setMediaFiles(prev => [...prev, file]);
                  setMediaPreview(prev => [...prev, data.imageUrl]);
                  setImaginalyPrompt('');
                  setShowImaginalyDialog(false);
                  toast({ title: "Image generated!", description: "Added to your post" });
                } catch (err: any) {
                  toast({ title: "Generation failed", description: err.message || "Try again", variant: "destructive" });
                } finally {
                  setImaginalyGenerating(false);
                }
              }}
              disabled={imaginalyGenerating || !imaginalyPrompt.trim()}
              className="w-full"
            >
              {imaginalyGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate & Attach
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}