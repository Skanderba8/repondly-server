import { ContactsView } from '@/components/ContactsView'
import { requireBusinessSession } from '@/lib/auth'
import { getContacts } from '@/lib/contacts'

export default async function ContactsPage() {
  const session = await requireBusinessSession()
  const contacts = await getContacts(session.user.id)

  return <ContactsView contacts={contacts} />
}
