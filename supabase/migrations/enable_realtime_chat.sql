-- Enables instant updates for the two-way Client ↔ Seller chat.
-- The guards make this migration safe to run more than once.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Message'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Message";
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'Conversation'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";
  END IF;
END $$;
