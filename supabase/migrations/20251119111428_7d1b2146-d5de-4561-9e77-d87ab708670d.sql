-- Enable realtime for channel_messages table
ALTER TABLE public.channel_messages REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;