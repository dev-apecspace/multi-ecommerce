-- Create Conversation table
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" SERIAL PRIMARY KEY,
  "userId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "vendorId" INT NOT NULL REFERENCES "Vendor"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "Conversation_userId_vendorId_key" UNIQUE("userId", "vendorId")
);

-- Create Message table
CREATE TABLE IF NOT EXISTS "Message" (
  "id" SERIAL PRIMARY KEY,
  "conversationId" INT NOT NULL REFERENCES "Conversation"(id) ON DELETE CASCADE,
  "senderId" INT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_conversation_userId" ON "Conversation"("userId");
CREATE INDEX IF NOT EXISTS "idx_conversation_vendorId" ON "Conversation"("vendorId");
CREATE INDEX IF NOT EXISTS "idx_message_conversationId" ON "Message"("conversationId");
CREATE INDEX IF NOT EXISTS "idx_message_senderId" ON "Message"("senderId");

-- Enable Realtime for Message table
-- Note: You might need to run this manually in Supabase SQL Editor if the publication doesn't exist or if you don't have permissions via migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'Message'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Message";
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'Conversation'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "Conversation";
  END IF;
END $$;
