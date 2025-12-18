'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recipeFormSchema, type RecipeFormValues } from '@/lib/validations/recipe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createRecipe, updateRecipe } from '@/app/(dashboard)/recipes/actions'
import type { RecipeWithParsedFields } from '@/types/recipe'

interface RecipeFormProps {
  recipe?: RecipeWithParsedFields
  mode: 'create' | 'edit'
}

export function RecipeForm({ recipe, mode }: RecipeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: recipe
      ? {
          title: recipe.title,
          description: recipe.description || undefined,
          source_url: recipe.source_url || undefined,
          prep_time_minutes: recipe.prep_time_minutes || undefined,
          cook_time_minutes: recipe.cook_time_minutes || undefined,
          servings: recipe.servings || 4,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions.map(i => ({ value: i })),
          tags: recipe.tags || [],
          image_url: recipe.image_url || undefined,
          nutrition_info: recipe.nutrition_info || undefined,
          is_public: recipe.is_public ?? false,
        }
      : {
          ingredients: [{ item: '', amount: '', unit: '' }],
          instructions: [{ value: '' }],
          tags: [],
          is_public: false,
          servings: 4,
        },
  })

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  })

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control,
    name: 'instructions',
  })

  const onSubmit = async (data: RecipeFormValues) => {
    setIsSubmitting(true)
    try {
      const result =
        mode === 'create'
          ? await createRecipe(data)
          : await updateRecipe(recipe!.id, data)

      if (result.success) {
        toast.success(mode === 'create' ? 'Recipe created!' : 'Recipe updated!')
        router.push('/recipes')
        router.refresh()
      } else {
        toast.error(result.error || 'Something went wrong')
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      toast.error('Failed to save recipe')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>The essentials about your recipe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              placeholder="Grandma's Chocolate Chip Cookies"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A brief description of your recipe..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prep_time_minutes">Prep Time (min)</Label>
              <Input
                id="prep_time_minutes"
                type="number"
                placeholder="15"
                {...register('prep_time_minutes', {
                  setValueAs: (v) => v === '' || isNaN(Number(v)) ? undefined : Number(v)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cook_time_minutes">Cook Time (min)</Label>
              <Input
                id="cook_time_minutes"
                type="number"
                placeholder="30"
                {...register('cook_time_minutes', {
                  setValueAs: (v) => v === '' || isNaN(Number(v)) ? undefined : Number(v)
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                placeholder="4"
                {...register('servings', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source_url">Source URL</Label>
            <Input
              id="source_url"
              type="url"
              placeholder="https://example.com/recipe"
              {...register('source_url')}
            />
            {errors.source_url && (
              <p className="text-sm text-destructive">{errors.source_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              type="url"
              placeholder="https://example.com/image.jpg"
              {...register('image_url')}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">{errors.image_url.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle>Ingredients *</CardTitle>
          <CardDescription>List all ingredients needed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Ingredient"
                  {...register(`ingredients.${index}.item`)}
                />
                <Input
                  placeholder="Amount"
                  {...register(`ingredients.${index}.amount`)}
                />
                <Input
                  placeholder="Unit (optional)"
                  {...register(`ingredients.${index}.unit`)}
                />
              </div>
              {ingredientFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendIngredient({ item: '', amount: '', unit: '' })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Ingredient
          </Button>
          {errors.ingredients && (
            <p className="text-sm text-destructive">{errors.ingredients.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions *</CardTitle>
          <CardDescription>Step-by-step directions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {instructionFields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <span className="font-medium text-muted-foreground pt-2">
                {index + 1}.
              </span>
              <Textarea
                placeholder="Describe this step..."
                rows={2}
                className="flex-1"
                {...register(`instructions.${index}.value`)}
              />
              {instructionFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInstruction(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendInstruction({ value: '' })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
          {errors.instructions && (
            <p className="text-sm text-destructive">{errors.instructions.message}</p>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Create Recipe' : 'Update Recipe'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
