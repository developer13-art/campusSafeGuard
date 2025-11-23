import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Link } from "wouter";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emergency rounded-md flex items-center justify-center">
              <Shield className="w-10 h-10 text-emergency-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Campus Emergency Alert</h1>
          <p className="text-muted-foreground">Secure emergency response and anonymous support system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive" data-testid="alert-login-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@campus.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <p className="text-muted-foreground">
                New student?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Create an account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Collapsible open={showTestAccounts} onOpenChange={setShowTestAccounts}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full" data-testid="button-toggle-test-accounts">
              <Info className="w-4 h-4 mr-2" />
              {showTestAccounts ? "Hide" : "Show"} Test Accounts
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Student Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => quickLogin("student1@campus.edu", "student123")}
                  data-testid="button-student1-login"
                >
                  student1@campus.edu / student123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => quickLogin("student2@campus.edu", "student123")}
                  data-testid="button-student2-login"
                >
                  student2@campus.edu / student123
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Department Staff Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => quickLogin("medical.staff@campus.edu", "medical123")}
                  data-testid="button-medical-login"
                >
                  medical.staff@campus.edu / medical123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => quickLogin("security.staff@campus.edu", "security123")}
                  data-testid="button-security-login"
                >
                  security.staff@campus.edu / security123
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => quickLogin("guidance.staff@campus.edu", "guidance123")}
                  data-testid="button-guidance-login"
                >
                  guidance.staff@campus.edu / guidance123
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Administrator Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => quickLogin("admin@campus.edu", "admin123")}
                  data-testid="button-admin-login"
                >
                  admin@campus.edu / admin123
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <p className="text-xs text-center text-muted-foreground">
          Campus Emergency Alert System v1.0 - Secure and Anonymous
        </p>
      </div>
    </div>
  );
}
