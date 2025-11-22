import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Settings() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [newEmail, setNewEmail] = useState("");
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(newEmail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (newEmail === user?.email) {
      toast.error("This is already your current email");
      return;
    }

    setIsChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setIsChangingEmail(false);

    if (error) {
      toast.error(error.message || "Failed to update email");
    } else {
      toast.success("Verification email sent to your new address");
      setNewEmail("");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsChangingPassword(false);

    if (error) {
      toast.error(error.message || "Failed to change password");
    } else {
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your current account information. Use Profile page to edit username and display name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                To change email, use the form below
              </p>
            </div>
            <div>
              <Label>Display Name</Label>
              <Input value={profile?.display_name || ""} disabled className="mt-2" />
            </div>
            <div>
              <Label>Username</Label>
              <Input value={profile?.username || ""} disabled className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Change Email</CardTitle>
            <CardDescription>Update your email address (verification required)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div>
                <Label htmlFor="new-email">New Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  required
                  className="mt-2"
                />
              </div>
              <Button type="submit" disabled={isChangingEmail}>
                {isChangingEmail ? "Sending Verification..." : "Change Email"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  className="mt-2"
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="mt-2"
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
