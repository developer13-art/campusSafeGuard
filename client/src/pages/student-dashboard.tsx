import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MessageCircle, History, User, LogOut, AlertOctagon } from "lucide-react";
import { useLocation } from "wouter";
import type { Alert, ChatSession } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/my-alerts"],
  });

  const { data: chatSessions, isLoading: chatsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/chats/my-sessions"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-success text-success-foreground";
      case "dispatched": return "bg-info text-info-foreground";
      case "acknowledged": return "bg-warning text-warning-foreground";
      default: return "bg-destructive text-destructive-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emergency rounded-md flex items-center justify-center">
              <AlertOctagon className="w-6 h-6 text-emergency-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Student Dashboard</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emergency border-2 bg-emergency/5 hover-elevate active-elevate-2 cursor-pointer transition-all" onClick={() => navigate("/student/emergency")} data-testid="card-emergency-alert">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-emergency flex items-center gap-2">
                      <AlertTriangle className="w-7 h-7" />
                      EMERGENCY ALERT
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                      Click here for immediate medical or security assistance
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Available 24/7 - Response team will be dispatched immediately
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate active-elevate-2 cursor-pointer" onClick={() => navigate("/student/chat")} data-testid="card-anonymous-chat">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MessageCircle className="w-6 h-6 text-primary" />
                  Anonymous Support Chat
                </CardTitle>
                <CardDescription>
                  Get confidential help from Medical, Security, or Guidance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your identity is completely protected
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <History className="w-6 h-6" />
              Recent Alerts
            </h2>
          </div>

          {alertsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <Card key={alert.id} data-testid={`card-alert-${alert.id}`}>
                  <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(alert.status)}>
                          {alert.status}
                        </Badge>
                        <Badge variant="outline">{alert.department}</Badge>
                      </div>
                      <CardTitle className="text-base">
                        {alert.department === "medical" ? "Medical Emergency" : "Security Alert"}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {alert.locationName || "Location not specified"} • {new Date(alert.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  {alert.responseNotes && (
                    <CardContent>
                      <p className="text-sm"><strong>Response:</strong> {alert.responseNotes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No emergency alerts yet</p>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Active Chats
          </h2>

          {chatsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : chatSessions && chatSessions.length > 0 ? (
            <div className="space-y-3">
              {chatSessions.filter(s => s.status === "active").map((session) => (
                <Card
                  key={session.id}
                  className="hover-elevate active-elevate-2 cursor-pointer"
                  onClick={() => navigate(`/student/chat/${session.id}`)}
                  data-testid={`card-chat-${session.id}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base font-mono">Session: {session.anonymousId}</CardTitle>
                        <CardDescription>
                          {session.department} Department • {session.lastMessageAt ? `Last message: ${new Date(session.lastMessageAt).toLocaleString()}` : "No messages yet"}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No active chat sessions</p>
                <Button className="mt-4" onClick={() => navigate("/student/chat")} data-testid="button-start-chat">
                  Start Anonymous Chat
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
