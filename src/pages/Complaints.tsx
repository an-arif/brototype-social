import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Plus, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Complaints() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintData, setComplaintData] = useState({
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintData.title.trim() || !complaintData.description.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("complaints").insert({
        user_id: user?.id,
        title: complaintData.title,
        description: complaintData.description,
        status: "open",
      });

      if (error) throw error;

      toast.success("Complaint submitted successfully!");
      setComplaintData({ title: "", description: "" });
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit complaint");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complaints</h1>
            <p className="text-muted-foreground">Public complaint and resolution system</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Submit a Complaint</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of the issue"
                    value={complaintData.title}
                    onChange={(e) => setComplaintData({ ...complaintData, title: e.target.value })}
                    className="bg-background/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Detailed description of the complaint"
                    value={complaintData.description}
                    onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                    className="min-h-[150px] bg-background/50 resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Complaint"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/50 glass">
            <TabsTrigger value="open" className="gap-2">
              <Clock className="h-4 w-4" />
              Open
            </TabsTrigger>
            <TabsTrigger value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="closed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Closed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4 mt-6">
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="text-lg">No open complaints yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Be the first to report an issue</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4 mt-6">
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="text-lg">No trending complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Trending complaints will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closed" className="space-y-4 mt-6">
            <Card className="glass-hover">
              <CardHeader>
                <CardTitle className="text-lg">No closed complaints</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Resolved complaints will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
