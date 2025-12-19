import { notFound } from 'next/navigation'
import { getShoppingList } from '../actions'
import { ShoppingListView } from '@/components/shopping-lists/shopping-list-view'
import { DeleteShoppingListButton } from '@/components/shopping-lists/delete-shopping-list-button'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface ShoppingListPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ShoppingListPage({ params }: ShoppingListPageProps) {
  const { id } = await params
  const result = await getShoppingList(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const shoppingList = result.data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/shopping-lists">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{shoppingList.name}</h1>
          {shoppingList.meal_plan_id && (
            <p className="text-muted-foreground">
              <Link
                href={`/meal-plans/${shoppingList.meal_plan_id}`}
                className="hover:underline"
              >
                View Meal Plan
              </Link>
            </p>
          )}
        </div>
        <DeleteShoppingListButton shoppingListId={shoppingList.id} />
      </div>

      <ShoppingListView shoppingList={shoppingList} />
    </div>
  )
}
