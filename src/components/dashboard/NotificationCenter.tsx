import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data: any;
  created_at: string;
}
const NotificationCenter = () => {
  const {
    user
  } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (user) {
      fetchNotifications();
      subscribeToNotifications();
    }
  }, [user]);
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const {
        data
      } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', {
        ascending: false
      }).limit(20);
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  const subscribeToNotifications = () => {
    if (!user) return;
    const channel = supabase.channel('notifications').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, () => {
      fetchNotifications();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  };
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase.from('notifications').update({
        read: true
      }).eq('id', notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? {
        ...n,
        read: true
      } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const markAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase.from('notifications').update({
        read: true
      }).eq('user_id', user.id).eq('read', false);
      setNotifications(prev => prev.map(n => ({
        ...n,
        read: true
      })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return '🤝';
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'achievement':
        return '🏆';
      case 'funding':
        return '💰';
      default:
        return '📢';
    }
  };
  return <Card>
      
      
    </Card>;
};
export default NotificationCenter;