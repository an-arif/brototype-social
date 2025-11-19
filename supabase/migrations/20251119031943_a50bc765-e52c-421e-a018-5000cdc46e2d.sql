-- Fix search_path for all notification functions
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT display_name INTO follower_name
  FROM public.profiles
  WHERE id = NEW.follower_id;

  PERFORM public.create_notification(
    NEW.following_id,
    'follow',
    'New Follower',
    follower_name || ' started following you',
    '/profile/' || NEW.follower_id
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reply_author_name TEXT;
  original_author_id UUID;
  notification_link TEXT;
BEGIN
  SELECT display_name INTO reply_author_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NEW.post_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id
    FROM public.posts
    WHERE id = NEW.post_id;
    
    notification_link := '/post/' || NEW.post_id;
    
    IF original_author_id != NEW.user_id THEN
      PERFORM public.create_notification(
        original_author_id,
        'reply',
        'New Reply',
        reply_author_name || ' replied to your post',
        notification_link
      );
    END IF;
  END IF;

  IF NEW.complaint_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id
    FROM public.complaints
    WHERE id = NEW.complaint_id;
    
    notification_link := '/complaint/' || NEW.complaint_id;
    
    IF original_author_id != NEW.user_id THEN
      PERFORM public.create_notification(
        original_author_id,
        'reply',
        'New Reply',
        reply_author_name || ' replied to your complaint',
        notification_link
      );
    END IF;
  END IF;

  IF NEW.parent_reply_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id
    FROM public.replies
    WHERE id = NEW.parent_reply_id;
    
    SELECT COALESCE('/post/' || post_id, '/complaint/' || complaint_id) INTO notification_link
    FROM public.replies
    WHERE id = NEW.parent_reply_id;
    
    IF original_author_id != NEW.user_id THEN
      PERFORM public.create_notification(
        original_author_id,
        'reply',
        'New Reply',
        reply_author_name || ' replied to your comment',
        notification_link
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  liker_name TEXT;
  original_author_id UUID;
  notification_link TEXT;
BEGIN
  SELECT display_name INTO liker_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF NEW.post_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id
    FROM public.posts
    WHERE id = NEW.post_id;
    
    notification_link := '/post/' || NEW.post_id;
    
    IF original_author_id != NEW.user_id THEN
      PERFORM public.create_notification(
        original_author_id,
        'like',
        'New Like',
        liker_name || ' liked your post',
        notification_link
      );
    END IF;
  END IF;

  IF NEW.reply_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id
    FROM public.replies
    WHERE id = NEW.reply_id;
    
    SELECT COALESCE('/post/' || post_id, '/complaint/' || complaint_id) INTO notification_link
    FROM public.replies
    WHERE id = NEW.reply_id;
    
    IF original_author_id != NEW.user_id THEN
      PERFORM public.create_notification(
        original_author_id,
        'like',
        'New Like',
        liker_name || ' liked your comment',
        notification_link
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  SELECT display_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  PERFORM public.create_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    sender_name || ' sent you a message',
    '/messages'
  );
  
  RETURN NEW;
END;
$$;