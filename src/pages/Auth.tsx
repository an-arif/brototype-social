import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import authHero from "@/assets/auth-hero.jpg";
import { Mail, Lock, User, Users } from "lucide-react";
export default function Auth() {
  const {
    signIn,
    signUp
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [signInData, setSignInData] = useState({
    email: "",
    password: ""
  });
  const [signUpData, setSignUpData] = useState({
    email: "",
    password: "",
    username: "",
    displayName: ""
  });
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // First check account status before attempting login
      const {
        data: profileData,
        error: profileError
      } = await supabase.from("profiles").select("account_status, status_reason").eq("id", (await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password
      })).data.user?.id).single();
      if (profileError || !profileData) {
        await signIn(signInData.email, signInData.password);
        return;
      }
      if (profileData.account_status !== "active") {
        let message = "Your account has been ";
        if (profileData.account_status === "banned") message += "banned";else if (profileData.account_status === "suspended") message += "suspended";else if (profileData.account_status === "disabled") message += "disabled";
        if (profileData.status_reason) message += `: ${profileData.status_reason}`;
        toast.error(message);
        await supabase.auth.signOut();
        return;
      }
      await signIn(signInData.email, signInData.password);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(signUpData.email, signUpData.password, signUpData.username, signUpData.displayName);
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-in">
          {/* Logo and Branding */}
          <div className="text-center space-y-2">
            <img src="https://website-main.blr1.cdn.digitaloceanspaces.com/assets/brototype_brother_logo.svg" alt="Brototype" className="h-14 mx-auto mb-6" />
            <h1 className="text-4xl font-bold tracking-tight">Brototype Connect</h1>
            <p className="text-muted-foreground text-lg">
              {isSignUp ? "Join the community" : "Welcome back"}
            </p>
          </div>

          {/* Auth Form */}
          <div className="space-y-6">
            {isSignUp ? <form onSubmit={handleSignUp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="username" type="text" placeholder="johndoe" value={signUpData.username} onChange={e => setSignUpData({
                  ...signUpData,
                  username: e.target.value
                })} required className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-sm font-medium">
                    Display Name
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="displayName" type="text" placeholder="John Doe" value={signUpData.displayName} onChange={e => setSignUpData({
                  ...signUpData,
                  displayName: e.target.value
                })} required className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="signup-email" type="email" placeholder="john@example.com" value={signUpData.email} onChange={e => setSignUpData({
                  ...signUpData,
                  email: e.target.value
                })} required className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="signup-password" type="password" placeholder="••••••••" value={signUpData.password} onChange={e => setSignUpData({
                  ...signUpData,
                  password: e.target.value
                })} required className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form> : <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="signin-email" type="email" placeholder="john@example.com" value={signInData.email} onChange={e => setSignInData({
                  ...signInData,
                  email: e.target.value
                })} required className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="signin-password" type="password" placeholder="••••••••" value={signInData.password} onChange={e => setSignInData({
                  ...signInData,
                  password: e.target.value
                })} required className="pl-10 h-12 bg-secondary/50 border-border/50 focus:border-primary transition-colors" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>}

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium hover:underline transition-colors">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>

            {/* Footer Text */}
            <p className="text-xs text-center text-muted-foreground pt-4">
              By continuing, you agree to Brototype's Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent z-10" />
        <img src={authHero} alt="Brototype Connect - Modern Learning Environment" className="w-full h-full object-cover" />
        <div className="absolute bottom-12 left-12 right-12 z-20 text-white space-y-4">
          <h2 className="text-4xl font-bold text-red-600">Connect. Learn. Grow.</h2>
          <p className="text-lg max-w-lg text-red-700">
            Join thousands of learners and professionals in the Brototype community. 
            Share knowledge, collaborate on projects, and advance your tech career.
          </p>
        </div>
      </div>
    </div>;
}