import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

export const useConnection = (userId: string | null) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ConnectionStatus>('none');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId && user) {
      checkConnectionStatus();
    } else {
      setLoading(false);
    }
  }, [userId, user]);

  const checkConnectionStatus = async () => {
    if (!user || !userId || user.id === userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id, requester_id, addressee_id, status')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConnectionId(data.id);
        if (data.status === 'accepted') {
          setStatus('connected');
        } else if (data.requester_id === user.id) {
          setStatus('pending_sent');
        } else {
          setStatus('pending_received');
        }
      } else {
        setStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async () => {
    if (!user || !userId) {
      toast.error('Please sign in to send connection requests');
      return;
    }

    if (user.id === userId) {
      toast.error("You can't connect with yourself");
      return;
    }

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          addressee_id: userId,
          status: 'pending',
        });

      if (error) throw error;

      setStatus('pending_sent');
      
      // Get requester's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'connection',
          title: 'New Connection Request',
          message: `${profile?.full_name || 'Someone'} wants to connect with you`,
          data: { requester_id: user.id }
        });

      toast.success('Connection request sent');
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('Failed to send connection request');
    }
  };

  const acceptConnection = async () => {
    if (!connectionId) return;

    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) throw error;

      setStatus('connected');
      toast.success('Connection accepted');
    } catch (error) {
      console.error('Error accepting connection:', error);
      toast.error('Failed to accept connection');
    }
  };

  const removeConnection = async () => {
    if (!connectionId) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      setStatus('none');
      setConnectionId(null);
      toast.success('Connection removed');
    } catch (error) {
      console.error('Error removing connection:', error);
      toast.error('Failed to remove connection');
    }
  };

  return {
    status,
    loading,
    sendConnectionRequest,
    acceptConnection,
    removeConnection,
  };
};
