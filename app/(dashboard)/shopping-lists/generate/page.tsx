'use client'

import { useState, useEffect, Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { generateShoppingListFromDateRange } from '../actions'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

function GenerateShoppingListForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Pre-fill from URL params if available
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    if (start) setStartDate(start)
    if (end) setEndDate(end)
  }, [searchParams])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be after start date')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateShoppingListFromDateRange(startDate, endDate)

      if (result.success && result.data) {
        toast.success('Shopping list generated!')
        router.push(`/shopping-lists/${result.data.id}`)
      } else {
        toast.error(result.error || 'Failed to generate shopping list')
      }
    } catch (error) {
      toast.error('Failed to generate shopping list')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Range</CardTitle>
        <CardDescription>
          Choose the dates for which you want to generate a shopping list
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" asChild>
              <Link href="/meal-plans">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Generate List
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function GenerateShoppingListPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/meal-plans">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate Shopping List</h1>
          <p className="text-muted-foreground">
            Select a date range to create a shopping list
          </p>
        </div>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      }>
        <GenerateShoppingListForm />
      </Suspense>
    </div>
  )
}
