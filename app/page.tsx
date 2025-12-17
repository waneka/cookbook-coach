import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChefHat, BookOpen, Calendar, MessageSquare, Sparkles } from 'lucide-react'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <ChefHat className="h-6 w-6" />
            <span>Cookbook Coach</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Meal Planning</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Your Personal Meal Planning{' '}
              <span className="text-primary">Coach</span>
            </h1>

            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Plan your meals, save recipes, and get personalized suggestions from your AI cooking assistant.
              Make meal planning effortless.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/sign-up">
                  Start Planning Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/50 py-24">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Everything You Need to Plan Better Meals
            </h2>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Recipe Library</h3>
                <p className="text-muted-foreground">
                  Save and organize your favorite recipes in one place
                </p>
              </div>

              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">AI Coach</h3>
                <p className="text-muted-foreground">
                  Chat with your personal meal planning assistant
                </p>
              </div>

              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Meal Plans</h3>
                <p className="text-muted-foreground">
                  Create weekly plans tailored to your dietary needs
                </p>
              </div>

              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ChefHat className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold">Smart Shopping</h3>
                <p className="text-muted-foreground">
                  Auto-generate shopping lists from your meal plans
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Cookbook Coach. Your personal meal planning assistant.</p>
        </div>
      </footer>
    </div>
  )
}
