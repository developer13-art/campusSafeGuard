import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Send, ArrowLeft, Shield, Activity, Heart, FileUp, Loader2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import type { ChatSession, Message } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

export default function AnonymousChat() {
  const [, params] = useRoute("/student/chat/:sessionId");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { socket } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDepartment, setSelectedDepartment] = useState<"medical" | "security" | "guidance" | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionId = params?.sessionId;

  const { data: session } = useQuery<ChatSession>({
    queryKey: ["/api/chats/sessions", sessionId],
    enabled: !!sessionId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/chats/messages", sessionId],
    enabled: !!sessionId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (department: "medical" | "security" | "guidance") => {
      return await apiRequest("POST", "/api/chats/sessions", { department });
    },
    onSuccess: (data: ChatSession) => {
      navigate(`/student/chat/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return await apiRequest("POST", "/api/chats/messages", {
        sessionId,
        content,
      });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/chats/messages", sessionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !sessionId) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message" && data.sessionId === sessionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/chats/messages", sessionId] });
      } else if (data.type === "staff_typing" && data.sessionId === sessionId) {
        setIsTyping(data.isTyping);
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, sessionId, queryClient]);

  const handleSend = () => {
    if (!message.trim() || !sessionId) return;
    sendMessageMutation.mutate(message);
  };

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case "medical": return <Activity className="w-5 h-5" />;
      case "security": return <Shield className="w-5 h-5" />;
      case "guidance": return <Heart className="w-5 h-5" />;
      default: return <MessageCircle className="w-5 h-5" />;
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/student")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Anonymous Support Chat</h1>
            <p className="text-muted-foreground">Select a department to start a confidential conversation</p>
          </div>

          <Alert className="mb-6 bg-info/10 border-info">
            <Shield className="h-4 w-4 text-info" />
            <AlertDescription>
              Your identity is completely protected. Staff will only see a random session ID.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-3">
            <Card
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${selectedDepartment === "medical" ? "border-primary border-2" : ""}`}
              onClick={() => setSelectedDepartment("medical")}
              data-testid="option-medical-chat"
            >
              <CardHeader>
                <Activity className="w-10 h-10 text-emergency mb-2" />
                <CardTitle>Medical</CardTitle>
                <CardDescription>Health concerns, wellness support, medical questions</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${selectedDepartment === "security" ? "border-primary border-2" : ""}`}
              onClick={() => setSelectedDepartment("security")}
              data-testid="option-security-chat"
            >
              <CardHeader>
                <Shield className="w-10 h-10 text-info mb-2" />
                <CardTitle>Security</CardTitle>
                <CardDescription>Safety concerns, suspicious activity, security issues</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className={`cursor-pointer transition-all hover-elevate active-elevate-2 ${selectedDepartment === "guidance" ? "border-primary border-2" : ""}`}
              onClick={() => setSelectedDepartment("guidance")}
              data-testid="option-guidance-chat"
            >
              <CardHeader>
                <Heart className="w-10 h-10 text-warning mb-2" />
                <CardTitle>Guidance</CardTitle>
                <CardDescription>Mental health, counseling, personal support</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            disabled={!selectedDepartment || createSessionMutation.isPending}
            onClick={() => selectedDepartment && createSessionMutation.mutate(selectedDepartment)}
            data-testid="button-start-chat"
          >
            {createSessionMutation.isPending ? "Starting Chat..." : "Start Anonymous Chat"}
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/student")} data-testid="button-back-dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          {session && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono" data-testid="badge-session-id">
                Session: {session.anonymousId}
              </Badge>
              <Badge className="flex items-center gap-1">
                {getDepartmentIcon(session.department)}
                {session.department}
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col">
        <Alert className="mb-4 bg-success/10 border-success">
          <Shield className="h-4 w-4 text-success" />
          <AlertDescription>
            <strong>You are anonymous.</strong> The {session?.department} department staff can only see your session ID: <span className="font-mono">{session?.anonymousId}</span>
          </AlertDescription>
        </Alert>

        <Card className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.id}`}
                  >
                    <div className={`max-w-[70%] ${msg.senderId === user?.id ? "bg-primary text-primary-foreground rounded-l-2xl rounded-tr-2xl" : "bg-muted rounded-r-2xl rounded-tl-2xl"} px-4 py-2`}>
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-r-2xl rounded-tl-2xl px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start the conversation with the {session?.department} department</p>
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="resize-none min-h-[60px]"
                data-testid="input-message"
              />
              <div className="flex flex-col gap-2">
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </Card>
      </main>
    </div>
  );
}
