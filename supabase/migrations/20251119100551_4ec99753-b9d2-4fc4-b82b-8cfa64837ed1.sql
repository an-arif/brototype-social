-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policies for feedback
CREATE POLICY "Users can insert their own feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all feedback"
  ON public.feedback FOR SELECT
  USING (true);

CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create admin_settings table for storing API keys
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Only admins can manage settings"
  ON public.admin_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create channels table for public chat
CREATE TABLE IF NOT EXISTS public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on channels
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

-- Everyone can view channels
CREATE POLICY "Everyone can view channels"
  ON public.channels FOR SELECT
  USING (true);

-- Only admins can create/update/delete channels
CREATE POLICY "Only admins can manage channels"
  ON public.channels FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
  ));

-- Create channel_messages table
CREATE TABLE IF NOT EXISTS public.channel_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on channel_messages
ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

-- Everyone can view channel messages
CREATE POLICY "Everyone can view channel messages"
  ON public.channel_messages FOR SELECT
  USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can insert their own channel messages"
  ON public.channel_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages, admins can delete any
CREATE POLICY "Users can delete their own channel messages"
  ON public.channel_messages FOR DELETE
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    )
  );

-- Insert the OpenAI API key
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('openai_api_key', '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')
ON CONFLICT (setting_key) DO NOTHING;