'use client'

import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/utils'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const supabase = createBrowserSupabaseClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.assign('/auth/signin')
  }

  return (
    <button
      type="button"
      className={cn('nx-btn nx-btn-ghost nx-btn-sm', className)}
      onClick={() => {
        void handleSignOut()
      }}
    >
      Déconnexion
    </button>
  )
}
