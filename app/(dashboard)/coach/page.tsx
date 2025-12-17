import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CoachPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Coach</h1>
        <p className="text-muted-foreground">
          Chat with your personal meal planning assistant
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            AI chat interface will be implemented in Phase 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will feature a conversational interface where you can discuss your dietary preferences, get recipe suggestions, and create meal plans with AI assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
