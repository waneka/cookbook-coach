import { DietaryPreferencesForm } from '@/components/profile/dietary-preferences-form'
import { getUserProfile } from './actions'

export default async function ProfilePage() {
  const result = await getUserProfile()

  const initialData = result.success && result.data
    ? {
        dietary_preferences: result.data.dietary_preferences || {
          allergies: [],
          diets: [],
          restrictions: [],
        },
        dietary_notes: result.data.dietary_notes || '',
      }
    : undefined

  return (
    <div className="h-full">
      <div className="pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile & Dietary Preferences</h1>
        <p className="text-muted-foreground">
          Manage your dietary preferences to get personalized recipe recommendations
        </p>
      </div>

      <DietaryPreferencesForm initialData={initialData} />
    </div>
  )
}
