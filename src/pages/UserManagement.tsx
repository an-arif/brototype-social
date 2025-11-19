import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateAccountStatus } from "@/hooks/useAccountStatus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserX, UserMinus, UserCog } from "lucide-react";

export default function UserManagement() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [status, setStatus] = useState<"active" | "banned" | "suspended" | "disabled">("active");
  const [reason, setReason] = useState("");
  const [suspendUntil, setSuspendUntil] = useState("");

  const updateStatus = useUpdateAccountStatus();

  const { data: users, isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleUpdateStatus = async () => {
    if (!selectedUserId) return;
    
    await updateStatus.mutateAsync({
      userId: selectedUserId,
      status,
      reason,
      until: suspendUntil && status === "suspended" ? new Date(suspendUntil) : undefined,
    });

    setSelectedUserId("");
    setReason("");
    setSuspendUntil("");
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <UserCog className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Update Status Form */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Update Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name} (@{user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "suspended" && (
                <div className="space-y-2">
                  <Label>Suspend Until</Label>
                  <Input
                    type="datetime-local"
                    value={suspendUntil}
                    onChange={(e) => setSuspendUntil(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for status change..."
                  className="min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleUpdateStatus}
                disabled={!selectedUserId || updateStatus.isPending}
                className="w-full"
              >
                {updateStatus.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Status
              </Button>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {users?.map((user) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{user.display_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{user.display_name}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <Badge
                        variant={
                          user.account_status === "active"
                            ? "default"
                            : user.account_status === "suspended"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {user.account_status || "active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
