import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { WebSocketProvider } from "./lib/websocket";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import StudentDashboard from "@/pages/student-dashboard";
import EmergencyAlert from "@/pages/emergency-alert";
import AnonymousChat from "@/pages/anonymous-chat";
import StaffDashboard from "@/pages/staff-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component, allowedRoles, ...rest }: { component: any; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Redirect to={`/${user.role === "student" ? "student" : user.role === "staff" ? "staff" : "admin"}`} />;
  }

  return <Component {...rest} />;
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? (
          <Redirect to={user.role === "student" ? "/student" : user.role === "staff" ? "/staff" : "/admin"} />
        ) : (
          <LoginPage />
        )}
      </Route>

      <Route path="/register">
        {user ? (
          <Redirect to={user.role === "student" ? "/student" : user.role === "staff" ? "/staff" : "/admin"} />
        ) : (
          <RegisterPage />
        )}
      </Route>

      <Route path="/student">
        <ProtectedRoute component={StudentDashboard} allowedRoles={["student"]} />
      </Route>

      <Route path="/student/emergency">
        <ProtectedRoute component={EmergencyAlert} allowedRoles={["student"]} />
      </Route>

      <Route path="/student/chat">
        <ProtectedRoute component={AnonymousChat} allowedRoles={["student"]} />
      </Route>

      <Route path="/student/chat/:sessionId">
        <ProtectedRoute component={AnonymousChat} allowedRoles={["student"]} />
      </Route>

      <Route path="/staff">
        <ProtectedRoute component={StaffDashboard} allowedRoles={["staff"]} />
      </Route>

      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
      </Route>

      <Route path="/">
        {user ? (
          <Redirect to={user.role === "student" ? "/student" : user.role === "staff" ? "/staff" : "/admin"} />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Toaster />
            <Router />
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
