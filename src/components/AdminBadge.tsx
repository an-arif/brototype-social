import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminBadge() {
  return (
    <Badge variant="default" className="gap-1 bg-primary/20 text-primary border-primary/30">
      <Shield className="h-3 w-3" />
      Admin
    </Badge>
  );
}
