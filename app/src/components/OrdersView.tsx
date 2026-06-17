'use client'

import { startTransition, type ReactNode, useMemo, useState } from 'react'
import { closestCenter, DndContext, DragEndEvent, DragOverlay, PointerSensor, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Package2, Plus } from 'lucide-react'
import { CreateOrderModal } from '@/components/CreateOrderModal'
import { OrderCard } from '@/components/OrderCard'
import { OrderDetailModal } from '@/components/OrderDetailModal'
import { ORDER_STATUS_LABELS, ORDER_STATUS_VALUES, PAYMENT_STATUS_LABELS } from '@/lib/order-meta'
import { cn } from '@/lib/utils'
import type { Order, OrderStatus, PaymentStatus } from '@/types'

const statusAccent: Record<OrderStatus, string> = {
  NOUVEAU: 'var(--brand)',
  CONFIRME: 'var(--teal)',
  EN_PREPARATION: 'var(--warning)',
  EXPEDIE: 'var(--followup)',
  LIVRE: 'var(--success)',
  ANNULE: 'var(--danger)',
}

function getTargetStatus(targetId: string | null) {
  if (!targetId) {
    return null
  }

  if (ORDER_STATUS_VALUES.includes(targetId as OrderStatus)) {
    return targetId as OrderStatus
  }

  const [status] = targetId.split(':')
  return ORDER_STATUS_VALUES.includes(status as OrderStatus) ? (status as OrderStatus) : null
}

function ColumnDropZone({
  status,
  children,
  isDragging,
}: {
  status: OrderStatus
  children: ReactNode
  isDragging: boolean
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[220px] flex-col gap-2 rounded-[var(--radius-btn)] transition-colors',
        isDragging && 'bg-[color:var(--bg-page)]/80',
        isOver && 'outline outline-1 outline-[color:var(--brand-border)]',
      )}
    >
      {children}
    </div>
  )
}

function SortableOrderCard({
  order,
  onOpen,
}: {
  order: Order
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${order.status}:${order.id}`,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <OrderCard order={order} accentColor={statusAccent[order.status]} onClick={onOpen} />
    </div>
  )
}

function formatAmount(value: string) {
  return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`
}

type OrdersViewProps = {
  orders: Order[]
}

export function OrdersView({ orders }: OrdersViewProps) {
  const [viewMode, setViewMode] = useState<'KANBAN' | 'TABLE'>('KANBAN')
  const [ordersState, setOrdersState] = useState(orders)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const groupedOrders = useMemo(
    () =>
      ORDER_STATUS_VALUES.map((status) => ({
        status,
        orders: ordersState.filter((order) => order.status === status),
      })),
    [ordersState],
  )

  const selectedOrder = useMemo(
    () => ordersState.find((order) => order.id === selectedOrderId) ?? null,
    [ordersState, selectedOrderId],
  )

  const draggingOrder = useMemo(
    () => ordersState.find((order) => order.id === draggingOrderId) ?? null,
    [draggingOrderId, ordersState],
  )

  async function patchOrder(id: string, payload: Partial<{
    status: OrderStatus
    paymentStatus: PaymentStatus
    notes: string
    deliveryMethod: string
    deliveryAddress: string
  }>) {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error('ORDER_PATCH_FAILED')
    }

    const result = (await response.json()) as { success: boolean; data?: Order }
    if (!result.data) {
      throw new Error('ORDER_PATCH_EMPTY')
    }

    setOrdersState((current) => current.map((order) => (order.id === result.data?.id ? result.data : order)))
    return result.data
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDraggingOrderId(null)

    const activeId = String(event.active.id)
    const orderId = activeId.split(':')[1]
    const nextStatus = getTargetStatus(event.over ? String(event.over.id) : null)
    const currentOrder = ordersState.find((order) => order.id === orderId)

    if (!currentOrder || !nextStatus || currentOrder.status === nextStatus) {
      return
    }

    setOrdersState((current) => current.map((order) => order.id === orderId ? { ...order, status: nextStatus } : order))

    try {
      await patchOrder(orderId, { status: nextStatus })
    } catch {
      setOrdersState((current) => current.map((order) => order.id === orderId ? currentOrder : order))
    }
  }

  return (
    <div className="nx-page">
      <header className="nx-page-header">
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={viewMode === 'KANBAN' ? 'nx-filter-chip is-active' : 'nx-filter-chip'}
            onClick={() => setViewMode('KANBAN')}
          >
            Kanban
          </button>
          <button
            type="button"
            className={viewMode === 'TABLE' ? 'nx-filter-chip is-active' : 'nx-filter-chip'}
            onClick={() => setViewMode('TABLE')}
          >
            Tableau
          </button>
          <button type="button" className="nx-btn nx-btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvelle commande
          </button>
        </div>
      </header>

      {viewMode === 'KANBAN' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => {
            const activeId = String(event.active.id)
            setDraggingOrderId(activeId.split(':')[1] ?? null)
          }}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <div className="overflow-x-auto">
            <div className="grid min-w-[980px] grid-cols-6 gap-3 pb-2">
              {groupedOrders.map((column) => (
                <div
                  key={column.status}
                  className="flex min-h-[calc(100dvh-210px)] min-w-0 flex-col gap-3 rounded-[var(--radius-card)] border border-[color:var(--border)] bg-[color:var(--bg-card)] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="nx-section-label">{ORDER_STATUS_LABELS[column.status]}</span>
                      <span className="nx-badge nx-badge-neutral">{column.orders.length}</span>
                    </div>
                    <button type="button" className="nx-btn nx-btn-ghost nx-btn-icon" onClick={() => setIsCreateOpen(true)} aria-label="Nouvelle commande">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <SortableContext items={column.orders.map((order) => `${order.status}:${order.id}`)} strategy={verticalListSortingStrategy}>
                    <ColumnDropZone status={column.status} isDragging={Boolean(draggingOrderId)}>
                      {column.orders.length > 0 ? (
                        column.orders.map((order) => (
                          <SortableOrderCard key={order.id} order={order} onOpen={() => setSelectedOrderId(order.id)} />
                        ))
                      ) : (
                        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[var(--radius-btn)] border border-dashed border-[color:var(--border)] bg-[color:var(--bg-page)] px-4 text-center">
                          <Package2 className="h-4 w-4 text-[color:var(--text-muted)]" aria-hidden="true" />
                          <p className="mt-2 text-[13px] font-medium text-[color:var(--text-secondary)]">Aucune commande</p>
                        </div>
                      )}
                    </ColumnDropZone>
                  </SortableContext>
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>
            {draggingOrder ? <OrderCard order={draggingOrder} accentColor={statusAccent[draggingOrder.status]} onClick={() => undefined} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <section className="nx-card overflow-hidden">
          <div className="nx-table-head" style={{ gridTemplateColumns: '0.8fr 1.2fr 1fr 0.9fr 0.8fr 0.9fr' }}>
            <span>Commande</span>
            <span>Client</span>
            <span>Statut</span>
            <span>Paiement</span>
            <span>Total</span>
            <span>Date</span>
          </div>
          {ordersState.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => setSelectedOrderId(order.id)}
              className="nx-table-row w-full text-left"
              style={{ gridTemplateColumns: '0.8fr 1.2fr 1fr 0.9fr 0.8fr 0.9fr' }}
            >
              <span className="nx-table-cell font-semibold text-[color:var(--text-primary)]">#{String(order.orderNumber).padStart(4, '0')}</span>
              <span className="nx-table-cell">{order.contact.name ?? order.contact.phone ?? order.contact.initials}</span>
              <span className="nx-table-cell">{ORDER_STATUS_LABELS[order.status]}</span>
              <span className="nx-table-cell">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</span>
              <span className="nx-table-cell">{formatAmount(order.totalAmount)}</span>
              <span className="nx-table-cell">{new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit' }).format(new Date(order.createdAt))}</span>
            </button>
          ))}
        </section>
      )}

      <CreateOrderModal
        open={isCreateOpen}
        pending={pending}
        onClose={() => setIsCreateOpen(false)}
        onCreate={async (payload) => {
          setPending(true)

          try {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

            if (!response.ok) {
              throw new Error('ORDER_CREATE_FAILED')
            }

            const result = (await response.json()) as { success: boolean; data?: Order }
            if (!result.data) {
              throw new Error('ORDER_CREATE_EMPTY')
            }

            startTransition(() => {
              setOrdersState((current) => [result.data as Order, ...current])
              setIsCreateOpen(false)
            })
          } finally {
            setPending(false)
          }
        }}
      />

      <OrderDetailModal
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        pending={pending}
        onClose={() => setSelectedOrderId(null)}
        onSave={async (payload) => {
          if (!selectedOrder) {
            return
          }

          setPending(true)

          try {
            await patchOrder(selectedOrder.id, payload)
          } finally {
            setPending(false)
          }
        }}
        onCancelOrder={async () => {
          if (!selectedOrder) {
            return
          }

          setPending(true)

          try {
            await patchOrder(selectedOrder.id, { status: 'ANNULE' })
          } finally {
            setPending(false)
          }
        }}
      />
    </div>
  )
}
