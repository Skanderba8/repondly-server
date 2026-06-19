import { PageHeader } from '@/components/ui/PageHeader'
import { SignOutButton } from '@/components/SignOutButton'
import { SettingsPageClient } from '@/components/SettingsPageClient'
import { requireBusinessSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function normalizeValue(value?: string | null) {
  return value ?? ''
}

type ChannelConnection = {
  channel: 'WHATSAPP' | 'INSTAGRAM'
  status: 'PENDING' | 'ACTIVE' | 'DISCONNECTED' | 'ERROR'
  label: string | null
  displayName: string | null
  unipileAccountId: string | null
  createdAt: Date
}

function isSupportedChannelConnection(
  connection: {
    channel: string
    status: 'PENDING' | 'ACTIVE' | 'DISCONNECTED' | 'ERROR'
    label: string | null
    displayName: string | null
    unipileAccountId: string | null
    createdAt: Date
  },
): connection is ChannelConnection {
  return connection.channel === 'WHATSAPP' || connection.channel === 'INSTAGRAM'
}

export default async function SettingsPage() {
  const session = await requireBusinessSession()

  const business = await prisma.business.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      plan: true,
      businessType: true,
      tone: true,
    },
  })

  const channelConnectionsResult = await prisma.businessChannelConnection.findMany({
    where: {
      businessId: session.user.id,
      channel: {
        in: ['WHATSAPP', 'INSTAGRAM'],
      },
    },
    select: {
      channel: true,
      status: true,
      label: true,
      displayName: true,
      unipileAccountId: true,
      createdAt: true,
    },
  })

  const channelConnections: ChannelConnection[] = channelConnectionsResult.filter(isSupportedChannelConnection)

  const connectionMap: Record<'WHATSAPP' | 'INSTAGRAM', ChannelConnection | undefined> = {
    WHATSAPP: channelConnections.find((item) => item.channel === 'WHATSAPP'),
    INSTAGRAM: channelConnections.find((item) => item.channel === 'INSTAGRAM'),
  }

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Connectez WhatsApp et Instagram via Unipile pour recevoir les messages dans l&apos;inbox Répondly."
        actions={<SignOutButton className="inline-flex h-9 w-fit items-center rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3 text-[13px] font-medium text-[color:var(--danger)] transition-colors duration-150 hover:bg-[color:var(--danger-soft)]" />}
      />
      <SettingsPageClient
        initialBusiness={{
          name: business?.name ?? '',
          email: business?.email ?? '',
          phone: business?.phone ?? '',
          businessType: business?.businessType ?? 'other',
          tone: business?.tone ?? 'friendly',
          plan: business?.plan ?? 'ESSENTIEL',
        }}
        initialChannels={{
          WHATSAPP: {
            channel: 'WHATSAPP',
            status: connectionMap.WHATSAPP?.status ?? 'NOT_CONNECTED',
            label: normalizeValue(connectionMap.WHATSAPP?.label),
            displayName: normalizeValue(connectionMap.WHATSAPP?.displayName),
            unipileAccountId: normalizeValue(connectionMap.WHATSAPP?.unipileAccountId),
            connectedAt: connectionMap.WHATSAPP?.createdAt.toISOString() ?? null,
          },
          INSTAGRAM: {
            channel: 'INSTAGRAM',
            status: connectionMap.INSTAGRAM?.status ?? 'NOT_CONNECTED',
            label: normalizeValue(connectionMap.INSTAGRAM?.label),
            displayName: normalizeValue(connectionMap.INSTAGRAM?.displayName),
            unipileAccountId: normalizeValue(connectionMap.INSTAGRAM?.unipileAccountId),
            connectedAt: connectionMap.INSTAGRAM?.createdAt.toISOString() ?? null,
          },
        }}
      />
      <section className="nx-card mt-4 p-4 md:p-5">
        <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Compte</h2>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Session active jusqu&apos;au {new Date(session.sessionExpiresAt).toLocaleString('fr-FR')}</p>
      </section>
    </>
  )
}
