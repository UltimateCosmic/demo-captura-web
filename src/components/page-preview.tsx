import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MicrofrontDropSurface } from "@/components/microfront-drop-surface"

export function PagePreview() {
  return (
    <Card className="h-full min-h-[480px]">
      <CardHeader className="border-b">
        <CardTitle>Preview estático de la página</CardTitle>
      </CardHeader>
      <CardContent>
        <MicrofrontDropSurface mode="admin" />
      </CardContent>
    </Card>
  )
}
