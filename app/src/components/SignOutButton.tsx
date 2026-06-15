'use client'

import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { cn } from '@/lib/utils'

type SignOutButtonProps = {
  className?: string
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter()
  const supabase = createBrowserSupabaseClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.replace('/auth/signin')
    router.refresh()
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
