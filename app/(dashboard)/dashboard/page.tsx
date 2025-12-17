import { auth } from '@clerk/nextjs/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Calendar, ShoppingCart, MessageSquare, Plus } from 'lucide-react'

export default async function DashboardPage() {
  const { userId } = await auth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Cookbook Coach</h1>
        <p className="text-muted-foreground mt-2">
          Your AI-powered meal planning assistant
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">saved recipes</p>
            <Button size="sm" className="mt-4" asChild>
              <Link href="/dashboard/recipes/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meal Plans</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">active plans</p>
            <Button size="sm" className="mt-4" asChild>
              <Link href="/dashboard/meal-plans/new">
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shopping Lists</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">active lists</p>
            <Button size="sm" className="mt-4" variant="outline" asChild>
              <Link href="/dashboard/shopping-lists">View Lists</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Coach</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Chat with your meal planning assistant
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/dashboard/coach">
                <MessageSquare className="h-4 w-4 mr-2" />
                Start Chat
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Get the most out of Cookbook Coach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              1
            </div>
            <div className="space-y-1">
              <p className="font-medium">Add your first recipe</p>
              <p className="text-sm text-muted-foreground">
                Import from a URL or manually enter your favorite recipes
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              2
            </div>
            <div className="space-y-1">
              <p className="font-medium">Chat with your AI coach</p>
              <p className="text-sm text-muted-foreground">
                Discuss your dietary preferences and meal planning goals
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              3
            </div>
            <div className="space-y-1">
              <p className="font-medium">Create your meal plan</p>
              <p className="text-sm text-muted-foreground">
                Let AI suggest a balanced weekly meal plan based on your recipes and preferences
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
