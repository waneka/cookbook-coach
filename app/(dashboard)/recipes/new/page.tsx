import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NewRecipePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Recipe</h1>
        <p className="text-muted-foreground">
          Create a new recipe or import from a URL
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Recipe creation form will be implemented in Phase 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will allow you to manually enter recipe details or paste a URL to import a recipe automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
