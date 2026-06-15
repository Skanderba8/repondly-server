import { OrdersView } from '@/components/OrdersView'
import { requireBusinessSession } from '@/lib/auth'
import { getOrders } from '@/lib/orders'

export default async function OrdersPage() {
  const session = await requireBusinessSession()
  const orders = await getOrders(session.user.id)

  return <OrdersView orders={orders} />
}
