import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useWebSocket } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, MessageCircle, LogOut, Bell, Check, Send as SendIcon, MapPin, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Alert, ChatSession, Message, UpdateAlertStatus } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const { socket } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newAlerts, setNewAlerts] = useState<Set<string>>(new Set());

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts/department", user?.department],
    enabled: !!user?.department && user.department !== "none",
  });

  const { data: chatSessions, isLoading: chatsLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/chats/department", user?.department],
    enabled: !!user?.department && user.department !== "none",
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/chats/messages", selectedChat],
    enabled: !!selectedChat,
  });

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "new_alert" && data.department === user?.department) {
        queryClient.invalidateQueries({ queryKey: ["/api/alerts/department", user?.department] });
        setNewAlerts(prev => new Set(prev).add(data.alertId));
        
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhELTKXh8bllHAU2jdXwyXksBSh+zPLaizsKGGS56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBSh+zPLaizsKF2S56+mjUxELTKXi8bllHAU2jdXwyXkrBQ==");
        audio.play().catch(() => {});
        
        toast({
          title: "New Emergency Alert",
          description: `${data.department} department - Check alerts tab`,
          variant: "destructive",
        });
      } else if (data.type === "chat_message") {
        queryClient.invalidateQueries({ queryKey: ["/api/chats/department", user?.department] });
        if (selectedChat) {
          queryClient.invalidateQueries({ queryKey: ["/api/chats/messages", selectedChat] });
        }
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, user, selectedChat, queryClient, toast]);

  const updateAlertMutation = useMutation({
    mutationFn: async ({ alertId, data }: { alertId: string; data: UpdateAlertStatus }) => {
      return await apiRequest("PATCH", `/api/alerts/${alertId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/department", user?.department] });
      setSelectedAlert(null);
      setResponseNotes("");
      toast({
        title: "Alert Updated",
        description: "Alert status has been updated successfully",
      });
    },
  });

  const handleUpdateAlert = (status: "acknowledged" | "dispatched" | "resolved") => {
    if (!selectedAlert) return;
    updateAlertMutation.mutate({
      alertId: selectedAlert.id,
      data: { status, responseNotes: responseNotes || undefined },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "bg-success text-success-foreground";
      case "dispatched": return "bg-info text-info-foreground";
      case "acknowledged": return "bg-warning text-warning-foreground";
      default: return "bg-destructive text-destructive-foreground";
    }
  };

  const getTimeSince = (date: Date | string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Staff Dashboard - {user?.department}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" onClick={logout} data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="alerts" className="relative" data-testid="tab-alerts">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Emergency Alerts
              {newAlerts.size > 0 && (
                <Badge className="ml-2 bg-emergency text-emergency-foreground">{newAlerts.size}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chats" data-testid="tab-chats">
              <MessageCircle className="w-4 h-4 mr-2" />
              Anonymous Chats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="grid gap-4">
                {alerts
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((alert) => (
                    <Card
                      key={alert.id}
                      className={`cursor-pointer hover-elevate active-elevate-2 ${newAlerts.has(alert.id) ? "border-emergency border-2" : ""} ${alert.status === "pending" ? "border-l-4 border-l-emergency" : ""}`}
                      onClick={() => {
                        setSelectedAlert(alert);
                        setNewAlerts(prev => {
                          const next = new Set(prev);
                          next.delete(alert.id);
                          return next;
                        });
                      }}
                      data-testid={`card-alert-${alert.id}`}
                    >
                      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getStatusColor(alert.status)}>{alert.status}</Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {getTimeSince(alert.createdAt)}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">Emergency Alert #{alert.id.slice(0, 8)}</CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1">
                            {alert.latitude && alert.longitude ? (
                              <>
                                <MapPin className="w-3 h-3" />
                                {alert.locationName || `${parseFloat(alert.latitude).toFixed(4)}, ${parseFloat(alert.longitude).toFixed(4)}`}
                              </>
                            ) : (
                              alert.locationName || "Location not specified"
                            )}
                          </CardDescription>
                        </div>
                        {alert.status === "pending" && (
                          <Bell className="w-6 h-6 text-emergency animate-pulse" />
                        )}
                      </CardHeader>
                      {alert.situationData && (
                        <CardContent>
                          <div className="text-sm space-y-1">
                            {Object.entries(alert.situationData).map(([key, value]) => (
                              <p key={key}>
                                <strong className="capitalize">{key}:</strong> {value}
                              </p>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No emergency alerts</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            {chatsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/3" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : chatSessions && chatSessions.length > 0 ? (
              <div className="grid gap-4">
                {chatSessions
                  .filter(s => s.status === "active")
                  .sort((a, b) => {
                    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : new Date(a.createdAt).getTime();
                    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : new Date(b.createdAt).getTime();
                    return bTime - aTime;
                  })
                  .map((session) => (
                    <Card
                      key={session.id}
                      className="cursor-pointer hover-elevate active-elevate-2"
                      onClick={() => setSelectedChat(session.id)}
                      data-testid={`card-chat-${session.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-mono">{session.anonymousId}</CardTitle>
                            <CardDescription>
                              {session.lastMessageAt ? `Last message: ${getTimeSince(session.lastMessageAt)}` : "No messages yet"}
                            </CardDescription>
                          </div>
                          <Badge>Active</Badge>
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
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!selectedAlert} onOpenChange={(open) => !open && setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl" data-testid="dialog-alert-details">
          <DialogHeader>
            <DialogTitle>Alert Details</DialogTitle>
            <DialogDescription>Emergency Alert #{selectedAlert?.id.slice(0, 8)}</DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className={`${getStatusColor(selectedAlert.status)} mt-1`}>{selectedAlert.status}</Badge>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Reported</Label>
                  <p className="text-sm mt-1">{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {(selectedAlert.latitude && selectedAlert.longitude) || selectedAlert.locationName ? (
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </Label>
                  {selectedAlert.locationName && (
                    <p className="text-sm mt-1 font-medium">{selectedAlert.locationName}</p>
                  )}
                  {selectedAlert.latitude && selectedAlert.longitude && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-muted-foreground font-mono">
                        Coordinates: {parseFloat(selectedAlert.latitude).toFixed(6)}, {parseFloat(selectedAlert.longitude).toFixed(6)}
                      </p>
                      {selectedAlert.locationAccuracy && (
                        <p className="text-xs text-muted-foreground">
                          Accuracy: ±{Math.round(parseFloat(selectedAlert.locationAccuracy))}m
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${selectedAlert.latitude},${selectedAlert.longitude}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                  )}
                  {!selectedAlert.latitude && !selectedAlert.longitude && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Location services not available when alert was sent
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Location
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    Location not captured
                  </p>
                </div>
              )}

              {selectedAlert.situationData && (
                <div>
                  <Label className="text-sm text-muted-foreground">Situation Assessment</Label>
                  <div className="mt-2 space-y-1">
                    {Object.entries(selectedAlert.situationData).map(([key, value]) => (
                      <p key={key} className="text-sm">
                        <strong className="capitalize">{key}:</strong> {value}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="response-notes">Response Notes (Optional)</Label>
                <Textarea
                  id="response-notes"
                  placeholder="Add notes about the response..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="mt-2"
                  data-testid="textarea-response-notes"
                />
              </div>

              <div className="flex gap-2">
                {selectedAlert.status === "pending" && (
                  <Button
                    onClick={() => handleUpdateAlert("acknowledged")}
                    disabled={updateAlertMutation.isPending}
                    variant="outline"
                    data-testid="button-acknowledge"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                )}
                {(selectedAlert.status === "pending" || selectedAlert.status === "acknowledged") && (
                  <Button
                    onClick={() => handleUpdateAlert("dispatched")}
                    disabled={updateAlertMutation.isPending}
                    data-testid="button-dispatch"
                  >
                    <SendIcon className="w-4 h-4 mr-2" />
                    Dispatch Response
                  </Button>
                )}
                {selectedAlert.status === "dispatched" && (
                  <Button
                    onClick={() => handleUpdateAlert("resolved")}
                    disabled={updateAlertMutation.isPending}
                    className="bg-success hover:bg-success/90"
                    data-testid="button-resolve"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Resolved
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
