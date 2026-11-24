import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'
import { getSupabaseConfig } from '@/lib/supabase/config'

export const createClient = (): SupabaseClient<Database> | null => {
  const config = getSupabaseConfig()
  if (!config) return null

  try {
    return createBrowserClient<Database>(config.url, config.key)
  } catch {
    return null
  }
}