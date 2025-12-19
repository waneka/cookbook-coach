'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateShoppingListFromMealPlan } from '@/app/(dashboard)/shopping-lists/actions'
import { toast } from 'sonner'

interface GenerateShoppingListButtonProps {
  mealPlanId: string
}

export function GenerateShoppingListButton({ mealPlanId }: GenerateShoppingListButtonProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateShoppingListFromMealPlan(mealPlanId)

      if (result.success && result.data) {
        toast.success('Shopping list generated!')
        router.push(`/shopping-lists/${result.data.id}`)
        router.refresh()
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
    <Button variant="default" size="sm" onClick={handleGenerate} disabled={isGenerating}>
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4 mr-2" />
          Generate Shopping List
        </>
      )}
    </Button>
  )
}
