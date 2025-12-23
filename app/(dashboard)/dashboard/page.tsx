import { CommandCenterHero } from '@/components/dashboard/command-center-hero'
import { ComingUpSection } from '@/components/dashboard/coming-up-section'
import { QuickAccessSection } from '@/components/dashboard/quick-access-section'
import { getMealPlanItemsByDateRange } from '@/app/(dashboard)/meal-plans/actions'
import { getShoppingLists } from '@/app/(dashboard)/shopping-lists/actions'
import { getRecipes } from '@/app/(dashboard)/recipes/actions'

export default async function DashboardPage() {
  // Get next 3 days starting from today
  const today = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 2) // Today + 2 days = 3 days total

  // Fetch upcoming meals
  const mealsResult = await getMealPlanItemsByDateRange(
    today.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  )

  // Fetch shopping lists
  const shoppingListsResult = await getShoppingLists()

  // Fetch recent recipes (limit to 5)
  const recipesResult = await getRecipes({ limit: 5 })

  // Group meals by date
  const upcomingMeals = []
  for (let i = 0; i < 3; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    const dateString = date.toISOString().split('T')[0]

    const dayMeals = mealsResult.data?.filter((item) => item.date === dateString) || []

    upcomingMeals.push({
      date: dateString,
      items: dayMeals,
    })
  }

  // Format shopping lists
  const shoppingLists = shoppingListsResult.data?.map((list) => {
    const items = Array.isArray(list.items) ? list.items : []
    const checkedCount = items.filter((item: any) => item.checked).length

    return {
      id: list.id,
      name: list.name,
      itemCount: items.length,
      checkedCount,
    }
  }) || []

  // Get recent recipes
  const recentRecipes = recipesResult.data || []

  return (
    <div className="space-y-8">
      {/* <CommandCenterHero /> */}
      <ComingUpSection upcomingMeals={upcomingMeals} />
      <QuickAccessSection shoppingLists={shoppingLists} recentRecipes={recentRecipes} />
    </div>
  )
}
