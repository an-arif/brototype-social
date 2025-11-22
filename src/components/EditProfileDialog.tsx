import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  display_name: z.string()
    .trim()
    .min(1, "Display name is required")
    .max(50, "Display name must be less than 50 characters"),
  username: z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  bio: z.string()
    .max(500, "Bio must be less than 500 characters")
    .optional(),
  avatar_url: z.string().optional(),
});

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function EditProfileDialog({ open, onOpenChange, userId }: EditProfileDialogProps) {
  const { data: profile } = useProfile(userId);
  const updateProfile = useUpdateProfile();
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      setFormData({ ...formData, avatar_url: publicUrl });
      toast.success("Avatar uploaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    try {
      profileSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    // Check if username is taken by another user
    if (formData.username !== profile?.username) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", formData.username)
        .neq("id", userId)
        .maybeSingle();

      if (existingUser) {
        toast.error("Username is already taken");
        return;
      }
    }

    try {
      await updateProfile.mutateAsync({ id: userId, updates: formData });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {formData.display_name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="w-full space-y-2">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={uploading}
                asChild
              >
                <label htmlFor="avatar-upload" className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload Avatar"}
                </label>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="Your name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              className="bg-background/50"
              required
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {formData.display_name.length}/50 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              className="bg-background/50"
              required
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">
              3-20 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="bg-background/50 min-h-[100px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateProfile.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}