'use client'

import Link from 'next/link'
import { UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChefHat, BookOpen, Calendar, ShoppingCart, MessageSquare, User, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

export function Navbar() {
  const [open, setOpen] = useState(false)

  const navLinks = [
    { href: '/recipes', icon: BookOpen, label: 'Recipes' },
    { href: '/meal-plans', icon: Calendar, label: 'Meal Plans' },
    { href: '/shopping-lists', icon: ShoppingCart, label: 'Shopping Lists' },
    { href: '/coach', icon: MessageSquare, label: 'AI Coach' },
    { href: '/profile', icon: User, label: 'Profile' },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ChefHat className="h-6 w-6" />
            <span>Cookbook Coach</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map(({ href, icon: Icon, label }) => (
              <Button key={href} variant="ghost" size="sm" asChild>
                <Link href={href}>
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map(({ href, icon: Icon, label }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className="justify-start"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}
