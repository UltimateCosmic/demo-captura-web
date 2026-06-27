import Link from "next/link"
import { UserRound, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Demo de Captura Web
              </h1>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild className="h-11 justify-start" variant="outline">
              <Link href="/admin">
                <Wrench />
                Admin
              </Link>
            </Button>
            <Button asChild className="h-11 justify-start" variant="outline">
              <Link href="/usuario">
                <UserRound />
                Usuario
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
