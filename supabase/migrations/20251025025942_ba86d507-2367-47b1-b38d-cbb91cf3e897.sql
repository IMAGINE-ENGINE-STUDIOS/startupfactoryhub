-- Enable realtime for PDF tables
ALTER TABLE pdf_editing_sessions REPLICA IDENTITY FULL;
ALTER TABLE pdf_operation_history REPLICA IDENTITY FULL;
ALTER TABLE pdf_collaboration_cursors REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_editing_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_operation_history;
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_collaboration_cursors;