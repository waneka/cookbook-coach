'use server'

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

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

export async function createConversation() {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        messages: [],
        context: {},
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Create conversation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create conversation',
    }
  }
}

export async function getConversation(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get conversation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation',
      data: null,
    }
  }
}

export async function getLatestConversation() {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Get latest conversation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get conversation',
      data: null,
    }
  }
}

export async function updateConversation(id: string, messages: any[]) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Conversation not found or unauthorized')
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .update({ messages })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Update conversation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update conversation',
    }
  }
}

export async function deleteConversation(id: string) {
  try {
    const userId = await getUserId()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing } = await supabase
      .from('ai_conversations')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing || existing.user_id !== userId) {
      throw new Error('Conversation not found or unauthorized')
    }

    const { error } = await supabase.from('ai_conversations').delete().eq('id', id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Delete conversation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete conversation',
    }
  }
}
