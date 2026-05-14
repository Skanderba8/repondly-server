import { redirect } from 'next/navigation'

export default function ChannelsPage() {
  // Redirect to dashboard with channels tab active for consistent navigation
  redirect('/dashboard#channels')
}
