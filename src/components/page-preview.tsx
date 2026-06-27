import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MicrofrontDropSurface } from "@/components/microfront-drop-surface";

export function PagePreview() {
  return (
    <Card className="h-full min-h-[480px]">
      <CardHeader className="border-b">
        <CardTitle>Preview estatico de la pagina</CardTitle>
      </CardHeader>
      <CardContent>
        <MicrofrontDropSurface mode="admin" />
      </CardContent>
    </Card>
  );
}
