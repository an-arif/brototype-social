import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/useUserRole";

export default function Feedback() {
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isAdmin = userRole?.role === "admin";

  const { data: feedbacks, refetch } = useQuery({
    queryKey: ["feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select(`
          *,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      title,
      description,
      category,
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      });
      setTitle("");
      setDescription("");
      setCategory("");
      refetch();
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-in">
          <h1 className="text-3xl font-bold mb-2">Feedback</h1>
          <p className="text-muted-foreground">Help us improve by sharing your feedback</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Submit Feedback</CardTitle>
            <CardDescription>Share your suggestions or report issues</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="improvement">Improvement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide detailed information about your feedback"
                  required
                  className="mt-2 min-h-[120px]"
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>All Feedback</CardTitle>
              <CardDescription>User feedback and suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {feedbacks?.map((feedback: any) => (
                <div key={feedback.id} className="p-4 border border-border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{feedback.title}</h3>
                    <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-accent rounded">
                      {feedback.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{feedback.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{feedback.profiles?.display_name || feedback.profiles?.username}</span>
                    <span>•</span>
                    <span>{format(new Date(feedback.created_at), "MMM d, yyyy")}</span>
                  </div>
                </div>
              ))}
              {!feedbacks?.length && (
                <p className="text-center text-muted-foreground py-8">No feedback yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
