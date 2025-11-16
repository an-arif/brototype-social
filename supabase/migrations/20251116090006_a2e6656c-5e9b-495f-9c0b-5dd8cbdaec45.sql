-- Add missing fields to complaints table
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category text DEFAULT 'other',
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;

-- Add check constraints for valid values
ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_severity_check;

ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_severity_check 
CHECK (severity IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.complaints 
DROP CONSTRAINT IF EXISTS complaints_category_check;

ALTER TABLE public.complaints 
ADD CONSTRAINT complaints_category_check 
CHECK (category IN ('electricity', 'network', 'system', 'staff', 'other'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_complaints_is_private ON public.complaints(is_private);
CREATE INDEX IF NOT EXISTS idx_complaints_severity ON public.complaints(severity);