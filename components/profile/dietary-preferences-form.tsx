'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateDietaryPreferencesSchema,
  type UpdateDietaryPreferencesValues,
  COMMON_ALLERGIES,
  DIET_TYPES,
  DIETARY_RESTRICTIONS,
} from '@/lib/validations/dietary-preferences'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateDietaryPreferences } from '@/app/(dashboard)/profile/actions'
import { Checkbox } from '@/components/ui/checkbox'

interface DietaryPreferencesFormProps {
  initialData?: UpdateDietaryPreferencesValues
}

export function DietaryPreferencesForm({ initialData }: DietaryPreferencesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<UpdateDietaryPreferencesValues>({
    resolver: zodResolver(updateDietaryPreferencesSchema),
    defaultValues: initialData || {
      dietary_preferences: {
        allergies: [],
        diets: [],
        restrictions: [],
      },
      dietary_notes: '',
    },
  })

  const preferences = watch('dietary_preferences')

  const toggleItem = (category: 'allergies' | 'diets' | 'restrictions', item: string) => {
    const current = preferences[category] || []
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item]

    setValue(`dietary_preferences.${category}`, updated)
  }

  const onSubmit = async (data: UpdateDietaryPreferencesValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateDietaryPreferences(data)

      if (result.success) {
        toast.success('Dietary preferences updated!')
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error('Failed to update preferences')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Allergies */}
      <Card>
        <CardHeader>
          <CardTitle>Allergies & Intolerances</CardTitle>
          <CardDescription>Select any foods you're allergic to or intolerant of</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {COMMON_ALLERGIES.map((allergy) => (
              <div key={allergy} className="flex items-center space-x-2">
                <Checkbox
                  id={`allergy-${allergy}`}
                  checked={preferences.allergies?.includes(allergy)}
                  onCheckedChange={() => toggleItem('allergies', allergy)}
                />
                <Label
                  htmlFor={`allergy-${allergy}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {allergy.replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diet Types */}
      <Card>
        <CardHeader>
          <CardTitle>Diet Types</CardTitle>
          <CardDescription>Select any diets you follow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DIET_TYPES.map((diet) => (
              <div key={diet} className="flex items-center space-x-2">
                <Checkbox
                  id={`diet-${diet}`}
                  checked={preferences.diets?.includes(diet)}
                  onCheckedChange={() => toggleItem('diets', diet)}
                />
                <Label
                  htmlFor={`diet-${diet}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {diet.replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dietary Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>Dietary Restrictions</CardTitle>
          <CardDescription>Select any dietary restrictions you observe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <div key={restriction} className="flex items-center space-x-2">
                <Checkbox
                  id={`restriction-${restriction}`}
                  checked={preferences.restrictions?.includes(restriction)}
                  onCheckedChange={() => toggleItem('restrictions', restriction)}
                />
                <Label
                  htmlFor={`restriction-${restriction}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {restriction.replace('-', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Dietary Notes</CardTitle>
          <CardDescription>
            Add any additional dietary guidelines, preferences, or notes. You can also ask the AI coach to help set these based on specific dietary plans or websites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="E.g., I'm trying to eat 150g of protein per day, avoid added sugars, prefer organic ingredients when possible..."
            rows={6}
            {...register('dietary_notes')}
          />
          {errors.dietary_notes && (
            <p className="text-sm text-destructive mt-2">{errors.dietary_notes.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Dietary Preferences
      </Button>
    </form>
  )
}
