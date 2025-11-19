-- Add account status tracking
CREATE TYPE account_status AS ENUM ('active', 'banned', 'suspended', 'disabled');

ALTER TABLE public.profiles 
ADD COLUMN account_status account_status DEFAULT 'active',
ADD COLUMN status_reason TEXT,
ADD COLUMN status_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN status_updated_by UUID REFERENCES public.profiles(id);

-- Create function to check account status on login
CREATE OR REPLACE FUNCTION public.check_account_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if account is suspended and suspension has expired
  IF NEW.account_status = 'suspended' AND NEW.status_until IS NOT NULL AND NEW.status_until < NOW() THEN
    NEW.account_status = 'active';
    NEW.status_reason = NULL;
    NEW.status_until = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to check status on profile updates
CREATE TRIGGER check_profile_status
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_account_status();

-- RLS policy for admins to manage account status
CREATE POLICY "Admins can update account status"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));