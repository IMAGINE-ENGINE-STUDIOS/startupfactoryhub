import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'connection' | 'event';
  data?: Record<string, any>;
}

export const useNotifications = () => {
  const createNotification = async ({
    userId,
    title,
    message,
    type,
    data,
  }: CreateNotificationParams) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data: data || {},
        });

      if (error) {
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Notification creation error:', error);
    }
  };

  const notifyConnection = async (userId: string, fromUserName: string) => {
    await createNotification({
      userId,
      title: 'New Connection Request',
      message: `${fromUserName} wants to connect with you`,
      type: 'connection',
    });
  };

  const notifyMessage = async (userId: string, fromUserName: string) => {
    await createNotification({
      userId,
      title: 'New Message',
      message: `${fromUserName} sent you a message`,
      type: 'message',
    });
  };

  const notifyEvent = async (userId: string, eventTitle: string, eventDate: string) => {
    await createNotification({
      userId,
      title: 'Event Reminder',
      message: `${eventTitle} starts soon`,
      type: 'event',
      data: { eventDate },
    });
  };

  return {
    createNotification,
    notifyConnection,
    notifyMessage,
    notifyEvent,
  };
};
