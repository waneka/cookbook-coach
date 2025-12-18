'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recipeFormSchema, type RecipeFormValues } from '@/lib/validations/recipe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Loader2, X, Sparkles, Tag, Link2, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createRecipe, updateRecipe, getUserTags, detectRecipeTags, importRecipeFromUrl, generateRecipeFromDescription } from '@/app/(dashboard)/recipes/actions'
import type { RecipeWithParsedFields } from '@/types/recipe'

interface RecipeFormProps {
  recipe?: RecipeWithParsedFields
  mode: 'create' | 'edit'
}

export function RecipeForm({ recipe, mode }: RecipeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showCreateTag, setShowCreateTag] = useState(false)
  const [isDetectingTags, setIsDetectingTags] = useState(false)
  const [showImportUrl, setShowImportUrl] = useState(false)
  const [showGenerateAi, setShowGenerateAi] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [generateDescription, setGenerateDescription] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
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

  const tags = watch('tags') || []
  const formValues = watch()

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      const result = await getUserTags()
      if (result.success) {
        setAvailableTags(result.data)
      }
    }
    fetchTags()
  }, [])

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setValue('tags', tags.filter(t => t !== tag))
    } else {
      setValue('tags', [...tags, tag])
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue('tags', [...tags, trimmedTag])
      // Add to available tags if it's new
      if (!availableTags.includes(trimmedTag)) {
        setAvailableTags([...availableTags, trimmedTag].sort())
      }
      setTagInput('')
      setShowCreateTag(false)
    }
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleDetectTags = async () => {
    setIsDetectingTags(true)
    try {
      const result = await detectRecipeTags({
        title: formValues.title,
        description: formValues.description,
        ingredients: formValues.ingredients,
        instructions: formValues.instructions,
      })

      if (result.success && result.data.length > 0) {
        // Add detected tags to current tags (avoiding duplicates)
        const newTags = [...new Set([...tags, ...result.data])]
        setValue('tags', newTags)

        // Add to available tags
        const updatedAvailable = [...new Set([...availableTags, ...result.data])].sort()
        setAvailableTags(updatedAvailable)

        toast.success(`Added ${result.data.length} tags based on recipe analysis`)
      } else {
        toast.error(result.error || 'Failed to detect tags')
      }
    } catch (error) {
      toast.error('Failed to detect tags')
    } finally {
      setIsDetectingTags(false)
    }
  }

  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error('Please enter a URL')
      return
    }

    setIsImporting(true)
    try {
      const result = await importRecipeFromUrl(importUrl)

      if (result.success && result.data) {
        const recipeData = result.data

        // Populate form fields
        setValue('title', recipeData.title)
        setValue('description', recipeData.description || '')
        setValue('prep_time_minutes', recipeData.prep_time_minutes || undefined)
        setValue('cook_time_minutes', recipeData.cook_time_minutes || undefined)
        setValue('servings', recipeData.servings || 4)
        setValue('source_url', recipeData.source_url || '')
        setValue('image_url', recipeData.image_url || '')

        // Set ingredients
        if (recipeData.ingredients && recipeData.ingredients.length > 0) {
          setValue('ingredients', recipeData.ingredients)
        }

        // Set instructions
        if (recipeData.instructions && recipeData.instructions.length > 0) {
          setValue('instructions', recipeData.instructions.map((inst: string) => ({ value: inst })))
        }

        // Set tags
        if (recipeData.tags && recipeData.tags.length > 0) {
          setValue('tags', recipeData.tags)
          // Add to available tags
          const updatedAvailable = [...new Set([...availableTags, ...recipeData.tags])].sort()
          setAvailableTags(updatedAvailable)
        }

        toast.success('Recipe imported successfully! Review and edit as needed.')
        setShowImportUrl(false)
        setImportUrl('')
      } else {
        toast.error(result.error || 'Failed to import recipe')
      }
    } catch (error) {
      toast.error('Failed to import recipe')
    } finally {
      setIsImporting(false)
    }
  }

  const handleGenerateRecipe = async () => {
    if (!generateDescription.trim()) {
      toast.error('Please describe the recipe you want')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateRecipeFromDescription(generateDescription)

      if (result.success && result.data) {
        const recipeData = result.data

        // Populate form fields
        setValue('title', recipeData.title)
        setValue('description', recipeData.description || '')
        setValue('prep_time_minutes', recipeData.prep_time_minutes || undefined)
        setValue('cook_time_minutes', recipeData.cook_time_minutes || undefined)
        setValue('servings', recipeData.servings || 4)
        setValue('image_url', recipeData.image_url || '')

        // Set ingredients
        if (recipeData.ingredients && recipeData.ingredients.length > 0) {
          setValue('ingredients', recipeData.ingredients)
        }

        // Set instructions
        if (recipeData.instructions && recipeData.instructions.length > 0) {
          setValue('instructions', recipeData.instructions.map((inst: string) => ({ value: inst })))
        }

        // Set tags
        if (recipeData.tags && recipeData.tags.length > 0) {
          setValue('tags', recipeData.tags)
          // Add to available tags
          const updatedAvailable = [...new Set([...availableTags, ...recipeData.tags])].sort()
          setAvailableTags(updatedAvailable)
        }

        toast.success('Recipe generated successfully! Review and edit as needed.')
        setShowGenerateAi(false)
        setGenerateDescription('')
      } else {
        toast.error(result.error || 'Failed to generate recipe')
      }
    } catch (error) {
      toast.error('Failed to generate recipe')
    } finally {
      setIsGenerating(false)
    }
  }

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
      {/* AI Tools - only show in create mode */}
      {mode === 'create' && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start with AI</CardTitle>
            <CardDescription>Import a recipe from a URL or generate one with AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowImportUrl(!showImportUrl)
                  setShowGenerateAi(false)
                }}
              >
                <Link2 className="h-4 w-4 mr-2" />
                Import from URL
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowGenerateAi(!showGenerateAi)
                  setShowImportUrl(false)
                }}
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Generate with AI
              </Button>
            </div>

            {/* Import from URL input */}
            {showImportUrl && (
              <div className="space-y-3 p-4 bg-background rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="import-url">Recipe URL</Label>
                  <Input
                    id="import-url"
                    type="url"
                    placeholder="https://example.com/recipe"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleImportFromUrl()
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleImportFromUrl}
                    disabled={isImporting || !importUrl.trim()}
                  >
                    {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import Recipe
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowImportUrl(false)
                      setImportUrl('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Generate with AI input */}
            {showGenerateAi && (
              <div className="space-y-3 p-4 bg-background rounded-lg border">
                <div className="space-y-2">
                  <Label htmlFor="generate-description">What would you like to make?</Label>
                  <Textarea
                    id="generate-description"
                    placeholder="E.g., 'A healthy vegetarian pasta dish with lots of vegetables' or 'Classic chocolate chip cookies'"
                    rows={3}
                    value={generateDescription}
                    onChange={(e) => setGenerateDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleGenerateRecipe}
                    disabled={isGenerating || !generateDescription.trim()}
                  >
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Recipe
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowGenerateAi(false)
                      setGenerateDescription('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

          {/* Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDetectTags}
                  disabled={isDetectingTags || !formValues.title}
                >
                  {isDetectingTags ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-2" />
                  )}
                  AI Detect
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateTag(!showCreateTag)}
                >
                  <Tag className="h-3 w-3 mr-2" />
                  Create New Tag
                </Button>
              </div>
            </div>

            {/* Create new tag input (hidden by default) */}
            {showCreateTag && (
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Enter tag name..."
                  className="h-9"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={addTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
            )}

            {/* Available tags (toggleable) */}
            {availableTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                      tags.includes(tag)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {availableTags.length === 0 && !showCreateTag && (
              <p className="text-xs text-muted-foreground">
                No tags yet. Click "Create New Tag" to add your first tag, or use "AI Detect" to automatically suggest tags.
              </p>
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
