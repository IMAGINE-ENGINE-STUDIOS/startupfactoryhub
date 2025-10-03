-- Create messages table for user-to-user messaging
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

-- Create conversations table to track last messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamp with time zone DEFAULT now(),
  last_message_content text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CONSTRAINT conversations_users_check CHECK (user1_id < user2_id)
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their own messages"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own sent messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can manage conversations"
ON public.conversations
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update conversation on new message
CREATE OR REPLACE FUNCTION public.update_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user1 uuid;
  user2 uuid;
BEGIN
  -- Ensure user1_id is always less than user2_id
  IF NEW.sender_id < NEW.receiver_id THEN
    user1 := NEW.sender_id;
    user2 := NEW.receiver_id;
  ELSE
    user1 := NEW.receiver_id;
    user2 := NEW.sender_id;
  END IF;

  -- Insert or update conversation
  INSERT INTO public.conversations (user1_id, user2_id, last_message_at, last_message_content)
  VALUES (user1, user2, NEW.created_at, NEW.content)
  ON CONFLICT (user1_id, user2_id)
  DO UPDATE SET
    last_message_at = NEW.created_at,
    last_message_content = NEW.content;

  RETURN NEW;
END;
$$;

-- Create trigger to update conversations
CREATE TRIGGER update_conversation_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation();

-- Create trigger for messages updated_at
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_users ON public.conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(receiver_id, read) WHERE read = false;

-- Add comments
COMMENT ON TABLE public.messages IS 'Direct messages between users';
COMMENT ON TABLE public.conversations IS 'Conversation threads tracking last messages';
COMMENT ON COLUMN public.messages.read IS 'Whether the receiver has read the message';
COMMENT ON COLUMN public.conversations.last_message_at IS 'Timestamp of the last message in conversation';