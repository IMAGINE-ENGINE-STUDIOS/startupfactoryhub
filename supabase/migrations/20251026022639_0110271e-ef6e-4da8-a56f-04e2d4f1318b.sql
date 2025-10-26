-- Phase 9: Advanced Collaboration Features Database Schema

-- Comments table for PDF annotations
CREATE TABLE IF NOT EXISTS pdf_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  page_number INTEGER NOT NULL,
  x_position FLOAT NOT NULL,
  y_position FLOAT NOT NULL,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comment replies for threaded discussions
CREATE TABLE IF NOT EXISTS pdf_comment_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES pdf_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity feed for tracking user actions
CREATE TABLE IF NOT EXISTS pdf_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'add_text', 'add_shape', 'delete', 'comment', 'edit', etc.
  action_data JSONB,
  page_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Version history for PDF sessions
CREATE TABLE IF NOT EXISTS pdf_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  canvas_data JSONB NOT NULL,
  is_auto_save BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications for user mentions and activity
CREATE TABLE IF NOT EXISTS pdf_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL,
  notification_type TEXT NOT NULL, -- 'mention', 'reply', 'activity', 'version_created'
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID, -- ID of comment, activity, or version
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE pdf_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_comments
CREATE POLICY "Users can view comments in their sessions"
  ON pdf_comments FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments in their sessions"
  ON pdf_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own comments"
  ON pdf_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON pdf_comments FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for pdf_comment_replies
CREATE POLICY "Users can view replies in their sessions"
  ON pdf_comment_replies FOR SELECT
  USING (
    comment_id IN (
      SELECT id FROM pdf_comments WHERE session_id IN (
        SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create replies in their sessions"
  ON pdf_comment_replies FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    comment_id IN (
      SELECT id FROM pdf_comments WHERE session_id IN (
        SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own replies"
  ON pdf_comment_replies FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own replies"
  ON pdf_comment_replies FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for pdf_activities
CREATE POLICY "Users can view activities in their sessions"
  ON pdf_activities FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities in their sessions"
  ON pdf_activities FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pdf_versions
CREATE POLICY "Users can view versions in their sessions"
  ON pdf_versions FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create versions in their sessions"
  ON pdf_versions FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    session_id IN (
      SELECT id FROM pdf_editing_sessions WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for pdf_notifications
CREATE POLICY "Users can view their own notifications"
  ON pdf_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications"
  ON pdf_notifications FOR INSERT
  WITH CHECK (true); -- Any authenticated user can create notifications

CREATE POLICY "Users can update their own notifications"
  ON pdf_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON pdf_notifications FOR DELETE
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_pdf_comments_session ON pdf_comments(session_id);
CREATE INDEX idx_pdf_comments_user ON pdf_comments(user_id);
CREATE INDEX idx_pdf_comment_replies_comment ON pdf_comment_replies(comment_id);
CREATE INDEX idx_pdf_activities_session ON pdf_activities(session_id);
CREATE INDEX idx_pdf_activities_created ON pdf_activities(created_at DESC);
CREATE INDEX idx_pdf_versions_session ON pdf_versions(session_id);
CREATE INDEX idx_pdf_versions_created ON pdf_versions(created_at DESC);
CREATE INDEX idx_pdf_notifications_user ON pdf_notifications(user_id);
CREATE INDEX idx_pdf_notifications_unread ON pdf_notifications(user_id, is_read);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_comment_replies;
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_versions;
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_notifications;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_pdf_comments_updated_at
  BEFORE UPDATE ON pdf_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pdf_comment_replies_updated_at
  BEFORE UPDATE ON pdf_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();