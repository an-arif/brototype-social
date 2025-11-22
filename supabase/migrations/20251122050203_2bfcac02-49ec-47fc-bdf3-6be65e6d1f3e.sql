-- Create function to delete user account and all related data
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete related data (cascading deletes will handle most of this, but being explicit)
  DELETE FROM public.notifications WHERE user_id = current_user_id;
  DELETE FROM public.messages WHERE sender_id = current_user_id OR receiver_id = current_user_id;
  DELETE FROM public.event_interests WHERE user_id = current_user_id;
  DELETE FROM public.feedback WHERE user_id = current_user_id;
  DELETE FROM public.follows WHERE follower_id = current_user_id OR following_id = current_user_id;
  DELETE FROM public.likes WHERE user_id = current_user_id;
  DELETE FROM public.complaint_upvotes WHERE user_id = current_user_id;
  DELETE FROM public.replies WHERE user_id = current_user_id;
  DELETE FROM public.posts WHERE user_id = current_user_id;
  DELETE FROM public.complaints WHERE user_id = current_user_id;
  DELETE FROM public.channel_messages WHERE user_id = current_user_id;
  DELETE FROM public.user_roles WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;
  
  -- Delete the auth user (this will cascade to other tables if configured)
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;