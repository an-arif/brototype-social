-- Repoint user_id FKs from auth.users to public.profiles so embeds to profiles work
-- Drop and recreate with same constraint names for PostgREST hints

-- posts.user_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE public.posts DROP CONSTRAINT posts_user_id_fkey;
  END IF;
  ALTER TABLE public.posts
    ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

-- complaints.user_id
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'complaints_user_id_fkey'
  ) THEN
    ALTER TABLE public.complaints DROP CONSTRAINT complaints_user_id_fkey;
  END IF;
  ALTER TABLE public.complaints
    ADD CONSTRAINT complaints_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
END $$;

-- complaints.assigned_to (nullable)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    WHERE c.conname = 'complaints_assigned_to_fkey'
  ) THEN
    ALTER TABLE public.complaints DROP CONSTRAINT complaints_assigned_to_fkey;
  END IF;
  ALTER TABLE public.complaints
    ADD CONSTRAINT complaints_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
END $$;
