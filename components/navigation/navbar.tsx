'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChefHat, BookOpen, Calendar, ShoppingCart, MessageSquare, User } from 'lucide-react'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ChefHat className="h-6 w-6" />
            <span>Cookbook Coach</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/recipes">
                <BookOpen className="h-4 w-4 mr-2" />
                Recipes
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/meal-plans">
                <Calendar className="h-4 w-4 mr-2" />
                Meal Plans
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/shopping-lists">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopping Lists
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/coach">
                <MessageSquare className="h-4 w-4 mr-2" />
                AI Coach
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}
