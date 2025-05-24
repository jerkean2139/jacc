import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, User, Users, Shield } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  const demoUsers = [
    {
      role: "Sales Agent",
      email: "sarah@tracerco.com",
      password: "sales123",
      icon: User,
      description: "Access sales tools and client management"
    },
    {
      role: "Client Admin", 
      email: "admin@testcompany.com",
      password: "admin123",
      icon: Users,
      description: "Manage company settings and users"
    },
    {
      role: "Dev Admin",
      email: "dev@jacc.com", 
      password: "dev123",
      icon: Shield,
      description: "Full system access and configuration"
    }
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign In to JACC</CardTitle>
          <CardDescription>
            Enter your credentials to access your merchant services assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Demo Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Accounts</CardTitle>
          <CardDescription>
            Click any option below to auto-fill credentials for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoUsers.map((user) => {
            const IconComponent = user.icon;
            return (
              <Button
                key={user.email}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => fillCredentials(user.email, user.password)}
              >
                <IconComponent className="h-5 w-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">{user.role}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                  <div className="text-xs text-slate-400">{user.description}</div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}