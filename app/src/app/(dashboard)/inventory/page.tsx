import { InventoryView } from '@/components/InventoryView'
import { requireBusinessSession } from '@/lib/auth'
import { getProducts } from '@/lib/products'

export default async function InventoryPage() {
  const session = await requireBusinessSession()
  const products = await getProducts(session.user.id)

  return <InventoryView products={products} />
}
