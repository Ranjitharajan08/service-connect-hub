
CREATE TABLE public.chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE,
  customer_id UUID NOT NULL,
  provider_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view chat"
ON public.chats FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = provider_user_id);

CREATE POLICY "Participants can create chat"
ON public.chats FOR INSERT
WITH CHECK (
  (auth.uid() = customer_id OR auth.uid() = provider_user_id)
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    LEFT JOIN public.providers p ON p.id = b.provider_id
    WHERE b.id = booking_id
      AND b.customer_id = chats.customer_id
      AND p.user_id = chats.provider_user_id
      AND (auth.uid() = b.customer_id OR auth.uid() = p.user_id)
  )
);

CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_chat_id ON public.messages(chat_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat participants can view messages"
ON public.messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chats c
  WHERE c.id = messages.chat_id
    AND (auth.uid() = c.customer_id OR auth.uid() = c.provider_user_id)
));

CREATE POLICY "Chat participants can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = messages.chat_id
      AND (auth.uid() = c.customer_id OR auth.uid() = c.provider_user_id)
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;
