-- Idempotent foreign key creation to enable implicit joins
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_fkey') THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_user_id_fkey') THEN
    ALTER TABLE public.complaints
      ADD CONSTRAINT complaints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaints_assigned_to_fkey') THEN
    ALTER TABLE public.complaints
      ADD CONSTRAINT complaints_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'replies_user_id_fkey') THEN
    ALTER TABLE public.replies
      ADD CONSTRAINT replies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'likes_user_id_fkey') THEN
    ALTER TABLE public.likes
      ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'complaint_upvotes_user_id_fkey') THEN
    ALTER TABLE public.complaint_upvotes
      ADD CONSTRAINT complaint_upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_follower_id_fkey') THEN
    ALTER TABLE public.follows
      ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_following_id_fkey') THEN
    ALTER TABLE public.follows
      ADD CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'events_created_by_fkey') THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_interests_user_id_fkey') THEN
    ALTER TABLE public.event_interests
      ADD CONSTRAINT event_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Recreate complaints SELECT policies to enforce privacy
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='complaints' AND policyname='Complaints are viewable by everyone'
  ) THEN
    DROP POLICY "Complaints are viewable by everyone" ON public.complaints;
  END IF;
END $$;

-- Create or replace public complaints policy
DROP POLICY IF EXISTS "Public complaints are viewable by everyone" ON public.complaints;
CREATE POLICY "Public complaints are viewable by everyone"
ON public.complaints
FOR SELECT
USING (is_private = false);

-- Create or replace private complaints policy
DROP POLICY IF EXISTS "Users and admins can view private complaints" ON public.complaints;
CREATE POLICY "Users and admins can view private complaints"
ON public.complaints
FOR SELECT
USING (
  is_private = true AND (
    auth.uid() = user_id OR 
    auth.uid() = assigned_to OR 
    has_role(auth.uid(), 'admin')
  )
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_to ON public.complaints(assigned_to);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.replies(user_id);
