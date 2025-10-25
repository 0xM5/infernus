import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address").max(255, "Email too long");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(128, "Password too long");
const nicknameSchema = z.string()
  .trim()
  .min(1, "Nickname is required")
  .max(50, "Nickname must be 50 characters or less")
  .regex(/^[a-zA-Z0-9_-]+$/, "Nickname can only contain letters, numbers, dash and underscore");
const accessKeySchema = z.string()
  .trim()
  .length(16, "Access key must be exactly 16 characters")
  .regex(/^[A-Z0-9]+$/, "Invalid access key format");

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const { user, signIn, signUp, signOut, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const validatePassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please confirm your email address");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Signed in successfully!");
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email) || !validatePassword(password)) {
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate nickname
    try {
      nicknameSchema.parse(nickname);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    // Validate access key
    try {
      accessKeySchema.parse(accessKey);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    const { error } = await signUp(email, password, nickname, accessKey);
    
    if (error) {
      if (error.message.includes("User already registered")) {
        toast.error("This email is already registered");
      } else if (error.message.includes("Password should be at least")) {
        toast.error("Password should be at least 6 characters");
      } else if (error.message.includes("Invalid access key")) {
        toast.error("Invalid access key");
      } else if (error.message.includes("Access key already used")) {
        toast.error("This access key has already been used");
      } else if (error.message.includes("Access key expired")) {
        toast.error("This access key has expired");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Account created successfully!");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset link sent to your email!");
      setShowResetPassword(false);
    }
    setLoading(false);
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center p-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-purple blur-3xl opacity-70 rounded-3xl" />
          
          <Card className="relative w-[450px] border-border bg-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResetPassword(false)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-8">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-purple blur-3xl opacity-70 rounded-3xl" />
        
        <Card className="relative w-[450px] border-border bg-card">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Infernus
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">.</span>
              app
            </CardTitle>
            <CardDescription>
              Sign in to your trading journal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 text-sm text-primary"
                    onClick={() => setShowResetPassword(true)}
                  >
                    Forgot password?
                  </Button>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nickname">Nickname</Label>
                    <Input
                      id="signup-nickname"
                      type="text"
                      placeholder="Your nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-key">Access Key</Label>
                    <Input
                      id="access-key"
                      type="text"
                      placeholder="Enter your access key"
                      value={accessKey}
                      onChange={(e) => setAccessKey(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;