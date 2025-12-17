import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Service role client for server-side operations that need to bypass RLS
 * WARNING: Only use this for trusted server-side code (webhooks, cron jobs, etc.)
 * Never expose the service role key to the client
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase service role credentials')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
