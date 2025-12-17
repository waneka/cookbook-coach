import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ShoppingListsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shopping Lists</h1>
        <p className="text-muted-foreground">
          Manage your shopping lists
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No shopping lists yet</CardTitle>
          <CardDescription>
            Shopping lists are automatically generated from meal plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Shopping list functionality will be implemented in Phase 5. Lists will aggregate ingredients from your meal plans.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
