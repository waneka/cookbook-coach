'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { mealPlanFormSchema, type MealPlanFormValues } from '@/lib/validations/meal-plan'
import { createMealPlan, updateMealPlan } from '@/app/(dashboard)/meal-plans/actions'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { MealPlan, MealPlanWithItems } from '@/types/meal-plan'

interface MealPlanFormProps {
  initialData?: MealPlan | MealPlanWithItems
  mode?: 'create' | 'edit'
}

export function MealPlanForm({ initialData, mode = 'create' }: MealPlanFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get default dates (current week)
  const getDefaultDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      start_date: monday.toISOString().split('T')[0],
      end_date: sunday.toISOString().split('T')[0],
    }
  }

  const defaultDates = getDefaultDates()

  const form = useForm<MealPlanFormValues>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          start_date: initialData.start_date,
          end_date: initialData.end_date,
          dietary_requirements: initialData.dietary_requirements as any,
        }
      : {
          name: `Week of ${new Date(defaultDates.start_date).toLocaleDateString()}`,
          start_date: defaultDates.start_date,
          end_date: defaultDates.end_date,
          dietary_requirements: undefined,
        },
  })

  async function onSubmit(data: MealPlanFormValues) {
    setIsSubmitting(true)
    try {
      const result =
        mode === 'edit' && initialData
          ? await updateMealPlan(initialData.id, data)
          : await createMealPlan(data)

      if (result.success) {
        toast.success(
          mode === 'edit' ? 'Meal plan updated!' : 'Meal plan created!'
        )
        router.push(mode === 'edit' ? `/meal-plans/${initialData?.id}` : `/meal-plans/${result.data?.id}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch (error) {
      toast.error('Failed to save meal plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Plan Name</FormLabel>
              <FormControl>
                <Input placeholder="Week of Dec 18, 2025" {...field} />
              </FormControl>
              <FormDescription>
                Give your meal plan a descriptive name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'edit' ? 'Update' : 'Create'} Meal Plan
          </Button>
        </div>
      </form>
    </Form>
  )
}
