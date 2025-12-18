'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { updateDietaryPreferencesSchema, type UpdateDietaryPreferencesValues } from '@/lib/validations/dietary-preferences'
import { revalidatePath } from 'next/cache'

// Get current user's database ID
async function getUserId() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single()

  if (!user) throw new Error('User not found')
  return user.id
}

export async function getUserProfile() {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get user profile error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get profile',
      data: null,
    }
  }
}

export async function updateDietaryPreferences(data: UpdateDietaryPreferencesValues) {
  try {
    const validated = updateDietaryPreferencesSchema.parse(data)
    const userId = await getUserId()
    const supabase = await createClient()

    console.log('Updating dietary preferences for user:', userId)
    console.log('Data:', validated)

    const { data: result, error } = await supabase
      .from('users')
      .update({
        dietary_preferences: validated.dietary_preferences,
        dietary_notes: validated.dietary_notes || null,
      })
      .eq('id', userId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Update result:', result)

    revalidatePath('/profile')
    revalidatePath('/coach')
    return { success: true }
  } catch (error) {
    console.error('Update dietary preferences error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preferences',
    }
  }
}
