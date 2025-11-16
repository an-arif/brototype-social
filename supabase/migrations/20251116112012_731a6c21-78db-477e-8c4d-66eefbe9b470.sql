-- Ensure replies.user_id has a FK to public.profiles so we can embed profiles in replies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'replies_user_id_fkey'
  ) THEN
    ALTER TABLE public.replies
      ADD CONSTRAINT replies_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;
