-- Fix all foreign key relationships to profiles table

-- Drop existing foreign keys if they exist
DO $$ 
BEGIN
    -- replies.user_id -> profiles.id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'replies_user_id_fkey' 
               AND table_name = 'replies') THEN
        ALTER TABLE public.replies DROP CONSTRAINT replies_user_id_fkey;
    END IF;
    
    -- complaints.user_id -> profiles.id  
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'complaints_user_id_fkey' 
               AND table_name = 'complaints') THEN
        ALTER TABLE public.complaints DROP CONSTRAINT complaints_user_id_fkey;
    END IF;
    
    -- complaints.assigned_to -> profiles.id
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'complaints_assigned_to_fkey' 
               AND table_name = 'complaints') THEN
        ALTER TABLE public.complaints DROP CONSTRAINT complaints_assigned_to_fkey;
    END IF;
END $$;

-- Add foreign keys pointing to profiles table
ALTER TABLE public.replies
  ADD CONSTRAINT replies_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.complaints
  ADD CONSTRAINT complaints_assigned_to_fkey 
  FOREIGN KEY (assigned_to) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;