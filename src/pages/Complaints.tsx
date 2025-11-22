import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Lock, Globe, Loader2, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useComplaints, useCreateComplaint, useUpvotes } from "@/hooks/useComplaints";
import { ComplaintCard } from "@/components/ComplaintCard";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Complaints() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [complaintData, setComplaintData] = useState({
    title: "",
    description: "",
    severity: "medium",
    category: "other",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: publicComplaints, isLoading: loadingPublic } = useComplaints("public");
  const { data: privateComplaints, isLoading: loadingPrivate } = useComplaints("private", user?.id);
  const { data: allUpvotes } = useUpvotes();
  const createComplaint = useCreateComplaint();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error("Only image files are allowed");
    }
    
    setUploadedFiles(prev => [...prev, ...imageFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintData.title.trim() || !complaintData.description.trim() || !user) return;

    setUploading(true);
    try {
      // Upload files to Supabase Storage
      const attachmentUrls: string[] = [];
      
      for (const file of uploadedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('attachments')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('attachments')
          .getPublicUrl(fileName);
        
        attachmentUrls.push(publicUrl);
      }

      await createComplaint.mutateAsync({
        ...complaintData,
        user_id: user.id,
        is_private: isPrivate,
        attachments: attachmentUrls,
      });

      setComplaintData({ title: "", description: "", severity: "medium", category: "other" });
      setUploadedFiles([]);
      setIsPrivate(false);
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const openComplaints = publicComplaints?.filter((c) => c.status === "open") || [];
  const closedComplaints = publicComplaints?.filter((c) => c.status === "closed") || [];
  
  // Calculate trending complaints by upvote count
  const trendingComplaints = [...(publicComplaints || [])].sort((a, b) => {
    const upvotesA = allUpvotes?.filter(u => u.complaint_id === a.id).length || 0;
    const upvotesB = allUpvotes?.filter(u => u.complaint_id === b.id).length || 0;
    return upvotesB - upvotesA;
  });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between animate-in">
          <div>
            <h1 className="text-3xl font-bold mb-2">Complaints</h1>
            <p className="text-muted-foreground">Public and private complaint system</p>
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
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    <Label htmlFor="private-toggle" className="cursor-pointer">
                      {isPrivate ? "Private Complaint" : "Public Complaint"}
                    </Label>
                  </div>
                  <Switch id="private-toggle" checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
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
                    onChange={(e) =>
                      setComplaintData({ ...complaintData, description: e.target.value })
                    }
                    className="min-h-[150px] bg-background/50 resize-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="severity">Problem Severity</Label>
                    <Select
                      value={complaintData.severity}
                      onValueChange={(value) => setComplaintData({ ...complaintData, severity: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select severity" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Related To</Label>
                    <Select
                      value={complaintData.category}
                      onValueChange={(value) => setComplaintData({ ...complaintData, category: value })}
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="glass-card">
                        <SelectItem value="electricity">Electricity</SelectItem>
                        <SelectItem value="network">Network</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attachments">Upload Photos (optional)</Label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        id="attachments"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="bg-background/50 cursor-pointer"
                      />
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-24 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            <p className="text-xs text-muted-foreground truncate mt-1">{file.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createComplaint.isPending || uploading}>
                    {createComplaint.isPending || uploading ? "Submitting..." : "Submit Complaint"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="public" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 glass">
            <TabsTrigger value="public" className="gap-2">
              <Globe className="h-4 w-4" />
              Public
            </TabsTrigger>
            <TabsTrigger value="private" className="gap-2">
              <Lock className="h-4 w-4" />
              Private
            </TabsTrigger>
          </TabsList>

          <TabsContent value="public" className="space-y-6 mt-6">
            <Tabs defaultValue="open" className="w-full">
              <TabsList className="w-full grid grid-cols-3 bg-background/30">
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="closed">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="space-y-4 mt-4">
                {loadingPublic ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : openComplaints.length > 0 ? (
                  openComplaints.map((complaint) => (
                    <ComplaintCard key={complaint.id} complaint={complaint} />
                  ))
                ) : (
                  <div className="text-center py-12 glass-card rounded-xl">
                    <p className="text-muted-foreground">No open complaints</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-4 mt-4">
                {loadingPublic ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : trendingComplaints.length > 0 ? (
                  trendingComplaints.map((complaint) => (
                    <ComplaintCard key={complaint.id} complaint={complaint} />
                  ))
                ) : (
                  <div className="text-center py-12 glass-card rounded-xl">
                    <p className="text-muted-foreground">No trending complaints</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed" className="space-y-4 mt-4">
                {loadingPublic ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : closedComplaints.length > 0 ? (
                  closedComplaints.map((complaint) => (
                    <ComplaintCard key={complaint.id} complaint={complaint} />
                  ))
                ) : (
                  <div className="text-center py-12 glass-card rounded-xl">
                    <p className="text-muted-foreground">No closed complaints</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="private" className="space-y-4 mt-6">
            {loadingPrivate ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : privateComplaints && privateComplaints.length > 0 ? (
              privateComplaints.map((complaint) => (
                <ComplaintCard key={complaint.id} complaint={complaint} />
              ))
            ) : (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No private complaints</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
