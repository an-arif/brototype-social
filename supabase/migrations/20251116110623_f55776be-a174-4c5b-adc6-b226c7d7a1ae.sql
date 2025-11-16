-- Add missing foreign keys to enable PostgREST joins with profiles
-- Wrap each in a guard to avoid failures if constraint already exists

-- posts.user_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_user_id_fkey'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- complaints.user_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaints_user_id_fkey'
  ) THEN
    ALTER TABLE public.complaints
    ADD CONSTRAINT complaints_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- complaints.assigned_to -> profiles.id (nullable)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaints_assigned_to_fkey'
  ) THEN
    ALTER TABLE public.complaints
    ADD CONSTRAINT complaints_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- replies.user_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'replies_user_id_fkey'
  ) THEN
    ALTER TABLE public.replies
    ADD CONSTRAINT replies_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- likes.user_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'likes_user_id_fkey'
  ) THEN
    ALTER TABLE public.likes
    ADD CONSTRAINT likes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- complaint_upvotes.user_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'complaint_upvotes_user_id_fkey'
  ) THEN
    ALTER TABLE public.complaint_upvotes
    ADD CONSTRAINT complaint_upvotes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- follows.follower_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_follower_id_fkey'
  ) THEN
    ALTER TABLE public.follows
    ADD CONSTRAINT follows_follower_id_fkey
    FOREIGN KEY (follower_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- follows.following_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'follows_following_id_fkey'
  ) THEN
    ALTER TABLE public.follows
    ADD CONSTRAINT follows_following_id_fkey
    FOREIGN KEY (following_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- events.created_by -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_created_by_fkey'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT events_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- event_interests.user_id -> profiles.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'event_interests_user_id_fkey'
  ) THEN
    ALTER TABLE public.event_interests
    ADD CONSTRAINT event_interests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
