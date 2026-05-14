import { redirect } from 'next/navigation'

export default function MessageriePage() {
  // Redirect to dashboard with inbox tab active for consistent navigation
  redirect('/dashboard#inbox')
}
