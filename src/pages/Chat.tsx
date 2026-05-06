import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Conversation = {
  bookingId: string;
  chatId: string | null;
  customerId: string;
  providerUserId: string;
  otherUserId: string;
  otherName: string;
  serviceType: string;
};

type Message = {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

const Chat = () => {
  const { user, role } = useAuth();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !role) return;
    loadConversations();
  }, [user, role]);

  const loadConversations = async () => {
    setLoading(true);
    let bookings: any[] = [];

    if (role === "customer") {
      const { data } = await supabase
        .from("bookings")
        .select("id, customer_id, provider_id, service_type, status, providers(user_id)")
        .eq("customer_id", user!.id)
        .eq("status", "accepted");
      bookings = data || [];
    } else if (role === "provider") {
      const { data: prov } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (prov) {
        const { data } = await supabase
          .from("bookings")
          .select("id, customer_id, provider_id, service_type, status, providers(user_id)")
          .eq("provider_id", prov.id)
          .eq("status", "accepted");
        bookings = data || [];
      }
    }

    if (bookings.length === 0) {
      setConvs([]);
      setLoading(false);
      return;
    }

    const { data: chats } = await supabase
      .from("chats")
      .select("*")
      .in("booking_id", bookings.map((b) => b.id));

    const chatByBooking = new Map((chats || []).map((c) => [c.booking_id, c]));

    const otherIds = bookings.map((b) =>
      role === "customer" ? b.providers?.user_id : b.customer_id
    ).filter(Boolean);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", otherIds);
    const nameMap = new Map((profiles || []).map((p) => [p.user_id, p.full_name]));

    const list: Conversation[] = bookings.map((b) => {
      const providerUserId = b.providers?.user_id;
      const otherUserId = role === "customer" ? providerUserId : b.customer_id;
      const chat = chatByBooking.get(b.id);
      return {
        bookingId: b.id,
        chatId: chat?.id ?? null,
        customerId: b.customer_id,
        providerUserId,
        otherUserId,
        otherName: nameMap.get(otherUserId) || "User",
        serviceType: b.service_type,
      };
    }).filter((c) => c.providerUserId);

    setConvs(list);
    setLoading(false);
  };

  const openConversation = async (c: Conversation) => {
    let chatId = c.chatId;
    if (!chatId) {
      const { data, error } = await supabase
        .from("chats")
        .insert({
          booking_id: c.bookingId,
          customer_id: c.customerId,
          provider_user_id: c.providerUserId,
        })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      chatId = data.id;
      c = { ...c, chatId };
      setConvs((prev) => prev.map((x) => (x.bookingId === c.bookingId ? c : x)));
    }
    setActive(c);
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId!)
      .order("created_at", { ascending: true });
    setMessages(msgs || []);
  };

  useEffect(() => {
    if (!active?.chatId) return;
    const channel = supabase
      .channel(`chat-${active.chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${active.chatId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === (payload.new as Message).id)) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [active?.chatId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !active?.chatId || !user) return;
    const msg = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({
      chat_id: active.chatId,
      sender_id: user.id,
      message: msg,
    });
    if (error) toast.error(error.message);
  };

  if (!user || !role) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Please sign in to access chat.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Messages</h1>
        <Card className="grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
          <div className="border-r bg-muted/20">
            <div className="border-b p-4">
              <h2 className="font-semibold">Conversations</h2>
            </div>
            <ScrollArea className="h-[calc(70vh-65px)]">
              {loading ? (
                <p className="p-4 text-sm text-muted-foreground">Loading…</p>
              ) : convs.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageCircle className="mb-2 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No conversations yet. Chats appear after a booking is accepted.
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {convs.map((c) => (
                    <button
                      key={c.bookingId}
                      onClick={() => openConversation(c)}
                      className={cn(
                        "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                        active?.bookingId === c.bookingId && "bg-accent"
                      )}
                    >
                      <div className="font-medium">{c.otherName}</div>
                      <div className="text-xs text-muted-foreground">{c.serviceType}</div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex flex-col">
            {!active ? (
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="mb-3 h-12 w-12" />
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                <div className="border-b p-4">
                  <div className="font-semibold">{active.otherName}</div>
                  <div className="text-xs text-muted-foreground">{active.serviceType}</div>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                  {messages.map((m) => {
                    const mine = m.sender_id === user.id;
                    return (
                      <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                            mine
                              ? "rounded-br-sm bg-primary text-primary-foreground"
                              : "rounded-bl-sm bg-muted text-foreground"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <p className={cn("mt-1 text-[10px] opacity-70", mine ? "text-right" : "text-left")}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">No messages yet. Say hi!</p>
                  )}
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="flex items-center gap-2 border-t p-3"
                >
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" className="gradient-primary text-primary-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Chat;
