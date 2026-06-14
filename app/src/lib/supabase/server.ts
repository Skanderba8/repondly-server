import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/shared'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

type CookieAdapter = {
  getAll: () => Array<{ name: string; value: string }>
  setAll: (cookiesToSet: CookieToSet[]) => void
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {}
      },
    },
  })
}

export function createRouteHandlerSupabaseClient(cookieAdapter: CookieAdapter) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieAdapter.getAll()
      },
      setAll(cookiesToSet) {
        cookieAdapter.setAll(cookiesToSet)
      },
    },
  })
}
