-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages they sent or received"
ON public.messages
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete messages they sent or received"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create indexes for performance
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Create function to create notification
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
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$;

-- Create trigger function for follow notifications
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's display name
  SELECT display_name INTO follower_name
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Create notification for the user being followed
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

-- Create trigger for follow notifications
DROP TRIGGER IF EXISTS trigger_follow_notification ON public.follows;
CREATE TRIGGER trigger_follow_notification
AFTER INSERT ON public.follows
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_follower();

-- Create trigger function for reply notifications
CREATE OR REPLACE FUNCTION public.notify_new_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reply_author_name TEXT;
  original_author_id UUID;
  notification_link TEXT;
BEGIN
  -- Get reply author's display name
  SELECT display_name INTO reply_author_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If it's a reply to a post
  IF NEW.post_id IS NOT NULL THEN
    -- Get post author
    SELECT user_id INTO original_author_id
    FROM public.posts
    WHERE id = NEW.post_id;
    
    notification_link := '/post/' || NEW.post_id;
    
    -- Don't notify if replying to own post
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

  -- If it's a reply to a complaint
  IF NEW.complaint_id IS NOT NULL THEN
    -- Get complaint author
    SELECT user_id INTO original_author_id
    FROM public.complaints
    WHERE id = NEW.complaint_id;
    
    notification_link := '/complaint/' || NEW.complaint_id;
    
    -- Don't notify if replying to own complaint
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

  -- If it's a reply to another reply
  IF NEW.parent_reply_id IS NOT NULL THEN
    -- Get parent reply author
    SELECT user_id INTO original_author_id
    FROM public.replies
    WHERE id = NEW.parent_reply_id;
    
    -- Get the link based on whether it's a post or complaint reply
    SELECT COALESCE('/post/' || post_id, '/complaint/' || complaint_id) INTO notification_link
    FROM public.replies
    WHERE id = NEW.parent_reply_id;
    
    -- Don't notify if replying to own reply
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

-- Create trigger for reply notifications
DROP TRIGGER IF EXISTS trigger_reply_notification ON public.replies;
CREATE TRIGGER trigger_reply_notification
AFTER INSERT ON public.replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_reply();

-- Create trigger function for like notifications
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  liker_name TEXT;
  original_author_id UUID;
  notification_link TEXT;
BEGIN
  -- Get liker's display name
  SELECT display_name INTO liker_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- If it's a like on a post
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

  -- If it's a like on a reply
  IF NEW.reply_id IS NOT NULL THEN
    SELECT user_id INTO original_author_id
    FROM public.replies
    WHERE id = NEW.reply_id;
    
    -- Get the link based on whether it's a post or complaint reply
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

-- Create trigger for like notifications
DROP TRIGGER IF EXISTS trigger_like_notification ON public.likes;
CREATE TRIGGER trigger_like_notification
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_like();

-- Create trigger function for message notifications
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's display name
  SELECT display_name INTO sender_name
  FROM public.profiles
  WHERE id = NEW.sender_id;

  -- Create notification for the receiver
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

-- Create trigger for message notifications
DROP TRIGGER IF EXISTS trigger_message_notification ON public.messages;
CREATE TRIGGER trigger_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_message();