import type { Prisma } from '@prisma/client'
import { PageHeader } from '@/components/ui/PageHeader'
import { SignOutButton } from '@/components/SignOutButton'
import { SettingsPageClient } from '@/components/SettingsPageClient'
import { requireBusinessSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function normalizeValue(value?: string | null) {
  return value ?? ''
}

type ChannelConnection = Prisma.BusinessChannelConnectionGetPayload<{
  select: {
    channel: true
    status: true
    label: true
    metaAppId: true
    metaUserId: true
    metaBusinessAccountId: true
    metaBusinessName: true
    metaPhoneNumberId: true
    metaPhoneNumber: true
    metaPageId: true
    metaPageName: true
    metaInstagramAccountId: true
    metaInstagramUsername: true
    accessToken: true
    webhookVerifyToken: true
  }
}>

export default async function SettingsPage() {
  const session = await requireBusinessSession()
  const [business, channelConnections] = await Promise.all([
    prisma.business.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        plan: true,
        businessType: true,
        tone: true,
      },
    }),
    prisma.businessChannelConnection.findMany({
      where: { businessId: session.user.id },
      select: {
        channel: true,
        status: true,
        label: true,
        metaAppId: true,
        metaUserId: true,
        metaBusinessAccountId: true,
        metaBusinessName: true,
        metaPhoneNumberId: true,
        metaPhoneNumber: true,
        metaPageId: true,
        metaPageName: true,
        metaInstagramAccountId: true,
        metaInstagramUsername: true,
        accessToken: true,
        webhookVerifyToken: true,
      },
    }) as Promise<ChannelConnection[]>,
  ])

  const connectionMap = {
    WHATSAPP: channelConnections.find((item) => item.channel === 'WHATSAPP'),
    MESSENGER: channelConnections.find((item) => item.channel === 'MESSENGER'),
    INSTAGRAM: channelConnections.find((item) => item.channel === 'INSTAGRAM'),
  }

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Paramètres" description="Branchez les actifs Meta réels de chaque client pour que l’inbox reçoive les messages." actions={<SignOutButton className="inline-flex h-9 w-fit items-center rounded-[var(--radius-sm)] border border-[color:var(--tone-danger-border)] bg-[color:var(--tone-danger-soft)] px-3 text-[13px] font-semibold text-[color:var(--tone-danger)] transition-opacity duration-[var(--transition-fast)] hover:opacity-80" />} />
      <SettingsPageClient
        initialBusiness={{
          name: business?.name ?? '',
          email: business?.email ?? '',
          phone: business?.phone ?? '',
          businessType: business?.businessType ?? 'other',
          tone: business?.tone ?? 'friendly',
          plan: business?.plan ?? 'TRIAL',
        }}
        initialChannels={{
          WHATSAPP: {
            channel: 'WHATSAPP',
            status: connectionMap.WHATSAPP?.status ?? 'NOT_CONNECTED',
            label: normalizeValue(connectionMap.WHATSAPP?.label),
            metaAppId: normalizeValue(connectionMap.WHATSAPP?.metaAppId),
            metaUserId: normalizeValue(connectionMap.WHATSAPP?.metaUserId),
            metaBusinessAccountId: normalizeValue(connectionMap.WHATSAPP?.metaBusinessAccountId),
            metaBusinessName: normalizeValue(connectionMap.WHATSAPP?.metaBusinessName),
            metaPhoneNumberId: normalizeValue(connectionMap.WHATSAPP?.metaPhoneNumberId),
            metaPhoneNumber: normalizeValue(connectionMap.WHATSAPP?.metaPhoneNumber),
            metaPageId: normalizeValue(connectionMap.WHATSAPP?.metaPageId),
            metaPageName: normalizeValue(connectionMap.WHATSAPP?.metaPageName),
            metaInstagramAccountId: normalizeValue(connectionMap.WHATSAPP?.metaInstagramAccountId),
            metaInstagramUsername: normalizeValue(connectionMap.WHATSAPP?.metaInstagramUsername),
            accessToken: normalizeValue(connectionMap.WHATSAPP?.accessToken),
            webhookVerifyToken: normalizeValue(connectionMap.WHATSAPP?.webhookVerifyToken),
          },
          MESSENGER: {
            channel: 'MESSENGER',
            status: connectionMap.MESSENGER?.status ?? 'NOT_CONNECTED',
            label: normalizeValue(connectionMap.MESSENGER?.label),
            metaAppId: normalizeValue(connectionMap.MESSENGER?.metaAppId),
            metaUserId: normalizeValue(connectionMap.MESSENGER?.metaUserId),
            metaBusinessAccountId: normalizeValue(connectionMap.MESSENGER?.metaBusinessAccountId),
            metaBusinessName: normalizeValue(connectionMap.MESSENGER?.metaBusinessName),
            metaPhoneNumberId: normalizeValue(connectionMap.MESSENGER?.metaPhoneNumberId),
            metaPhoneNumber: normalizeValue(connectionMap.MESSENGER?.metaPhoneNumber),
            metaPageId: normalizeValue(connectionMap.MESSENGER?.metaPageId),
            metaPageName: normalizeValue(connectionMap.MESSENGER?.metaPageName),
            metaInstagramAccountId: normalizeValue(connectionMap.MESSENGER?.metaInstagramAccountId),
            metaInstagramUsername: normalizeValue(connectionMap.MESSENGER?.metaInstagramUsername),
            accessToken: normalizeValue(connectionMap.MESSENGER?.accessToken),
            webhookVerifyToken: normalizeValue(connectionMap.MESSENGER?.webhookVerifyToken),
          },
          INSTAGRAM: {
            channel: 'INSTAGRAM',
            status: connectionMap.INSTAGRAM?.status ?? 'NOT_CONNECTED',
            label: normalizeValue(connectionMap.INSTAGRAM?.label),
            metaAppId: normalizeValue(connectionMap.INSTAGRAM?.metaAppId),
            metaUserId: normalizeValue(connectionMap.INSTAGRAM?.metaUserId),
            metaBusinessAccountId: normalizeValue(connectionMap.INSTAGRAM?.metaBusinessAccountId),
            metaBusinessName: normalizeValue(connectionMap.INSTAGRAM?.metaBusinessName),
            metaPhoneNumberId: normalizeValue(connectionMap.INSTAGRAM?.metaPhoneNumberId),
            metaPhoneNumber: normalizeValue(connectionMap.INSTAGRAM?.metaPhoneNumber),
            metaPageId: normalizeValue(connectionMap.INSTAGRAM?.metaPageId),
            metaPageName: normalizeValue(connectionMap.INSTAGRAM?.metaPageName),
            metaInstagramAccountId: normalizeValue(connectionMap.INSTAGRAM?.metaInstagramAccountId),
            metaInstagramUsername: normalizeValue(connectionMap.INSTAGRAM?.metaInstagramUsername),
            accessToken: normalizeValue(connectionMap.INSTAGRAM?.accessToken),
            webhookVerifyToken: normalizeValue(connectionMap.INSTAGRAM?.webhookVerifyToken),
          },
        }}
      />
      <section className="rp-panel mt-4 p-4 md:p-5">
        <h2 className="text-sm font-semibold text-[color:var(--text-primary)]">Compte</h2>
        <p className="mt-2 text-sm text-[color:var(--text-secondary)]">Session active jusqu'au {new Date(session.sessionExpiresAt).toLocaleString('fr-FR')}</p>
      </section>
    </>
  )
}
