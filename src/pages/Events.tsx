import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Heart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Events() {
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    event_date: "",
  });

  const isAdmin = userRole?.role === "admin";

  const { data: events } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date");
      if (error) throw error;
      return data;
    },
  });

  const createEvent = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("events").insert({ ...eventData, created_by: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event created!");
      setOpen(false);
    },
  });

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-muted-foreground">Upcoming events</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Create Event</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Title</Label><Input value={eventData.title} onChange={(e) => setEventData({ ...eventData, title: e.target.value })} /></div>
                  <div><Label>Description</Label><Textarea value={eventData.description} onChange={(e) => setEventData({ ...eventData, description: e.target.value })} /></div>
                  <div><Label>Date & Time</Label><Input type="datetime-local" value={eventData.event_date} onChange={(e) => setEventData({ ...eventData, event_date: e.target.value })} /></div>
                  <Button onClick={() => createEvent.mutate()} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="space-y-4">
          {events?.map((event: any) => (
            <Card key={event.id}>
              <CardHeader><CardTitle>{event.title}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />{format(new Date(event.event_date), "PPP")}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4" />{format(new Date(event.event_date), "p")}</div>
                </div>
                <p>{event.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
