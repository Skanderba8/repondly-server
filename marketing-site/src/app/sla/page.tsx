import LegalShell from '@/components/LegalShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Service Level Agreement — Répondly',
  description:
    'Engagements de niveau de service de Répondly : disponibilité, support, maintenance et limites de responsabilité.',
}

const C = {
  ink: '#0d1b2e',
  mid: '#5a6a80',
  blue: '#1a6bff',
  border: '#e2e8f0',
  bgAlt: '#f4f7fb',
}

const s = {
  h1: {
    fontSize: 28,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 4,
  } as React.CSSProperties,
  subtitle: {
    fontSize: 13,
    color: C.mid,
    marginBottom: 32,
  } as React.CSSProperties,
  h2: {
    fontSize: 16,
    fontWeight: 700,
    color: C.ink,
    marginBottom: 10,
    marginTop: 0,
  } as React.CSSProperties,
  section: {
    marginBottom: 32,
    paddingBottom: 32,
    borderBottom: `1px solid ${C.border}`,
  } as React.CSSProperties,
  lastSection: {
    marginBottom: 0,
  } as React.CSSProperties,
  p: {
    fontSize: 14,
    color: C.mid,
    lineHeight: '1.75',
    margin: '0 0 10px 0',
  } as React.CSSProperties,
  ul: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  } as React.CSSProperties,
  li: {
    display: 'flex',
    gap: 10,
    marginBottom: 8,
    fontSize: 14,
    color: C.mid,
    lineHeight: '1.6',
  } as React.CSSProperties,
  bullet: {
    color: C.blue,
    flexShrink: 0,
    marginTop: 2,
  } as React.CSSProperties,
  highlight: {
    background: C.bgAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: '14px 18px',
    marginTop: 10,
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginTop: 10,
    fontSize: 14,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    background: C.bgAlt,
    color: C.ink,
    fontWeight: 600,
    border: `1px solid ${C.border}`,
    fontSize: 13,
  } as React.CSSProperties,
  td: {
    padding: '8px 12px',
    color: C.mid,
    border: `1px solid ${C.border}`,
    fontSize: 14,
  } as React.CSSProperties,
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={s.li}>
      <span style={s.bullet}>▸</span>
      <span>{children}</span>
    </li>
  )
}

export default function SLAPage() {
  return (
    <LegalShell>
      <h1 style={s.h1}>Service Level Agreement</h1>
      <p style={s.subtitle}>Dernière mise à jour : 1er juin 2025</p>

      {/* 1. Disponibilité */}
      <div style={s.section}>
        <h2 style={s.h2}>1. Disponibilité (Uptime)</h2>
        <p style={s.p}>
          Répondly s&apos;engage à maintenir une disponibilité cible de <strong>99 %</strong> sur une
          base mensuelle, hors fenêtres de maintenance planifiée.
        </p>
        <div style={s.highlight}>
          <p style={{ ...s.p, margin: 0, fontWeight: 600, color: C.ink }}>Engagement de disponibilité</p>
          <p style={{ ...s.p, margin: '8px 0 0 0', marginBottom: 0 }}>
            Uptime cible : <strong>99 %</strong> par mois calendaire, calculé hors périodes de
            maintenance planifiée annoncées conformément à l&apos;article 3 du présent document.
          </p>
        </div>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          La disponibilité est mesurée au niveau de l&apos;infrastructure applicative de Répondly.
          Les interruptions imputables à des tiers (Meta, Contabo, opérateurs réseau) ne sont pas
          comptabilisées dans le calcul du taux de disponibilité.
        </p>
      </div>

      {/* 2. Support */}
      <div style={s.section}>
        <h2 style={s.h2}>2. Support Client</h2>
        <p style={s.p}>
          Les délais de réponse au support varient selon le plan souscrit :
        </p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Plan</th>
              <th style={s.th}>Délai de réponse initiale</th>
              <th style={s.th}>Canal</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.td}><strong>Starter</strong></td>
              <td style={s.td}>24 heures ouvrées</td>
              <td style={s.td}>E-mail</td>
            </tr>
            <tr>
              <td style={s.td}><strong>Pro</strong></td>
              <td style={s.td}>24 heures ouvrées</td>
              <td style={s.td}>E-mail</td>
            </tr>
            <tr>
              <td style={s.td}><strong>Business</strong></td>
              <td style={s.td}>8 heures ouvrées</td>
              <td style={s.td}>E-mail prioritaire</td>
            </tr>
          </tbody>
        </table>
        <p style={{ ...s.p, marginTop: 14, marginBottom: 0 }}>
          Les heures ouvrées s&apos;entendent du lundi au vendredi, de 9h00 à 18h00 (heure de Tunis),
          hors jours fériés tunisiens. Les demandes reçues en dehors de ces plages sont traitées
          le prochain jour ouvré.
        </p>
      </div>

      {/* 3. Maintenance Planifiée */}
      <div style={s.section}>
        <h2 style={s.h2}>3. Maintenance Planifiée</h2>
        <p style={s.p}>
          Répondly se réserve le droit d&apos;effectuer des opérations de maintenance planifiée
          (mises à jour, migrations, optimisations) pouvant entraîner une interruption temporaire
          du service.
        </p>
        <ul style={s.ul}>
          <Li>Toute fenêtre de maintenance planifiée est annoncée <strong>48 heures à l&apos;avance</strong> par e-mail à l&apos;adresse de contact du compte client.</Li>
          <Li>Les maintenances sont programmées de préférence en dehors des heures de pointe (nuit ou week-end).</Li>
          <Li>La durée estimée de chaque intervention est communiquée dans l&apos;avis de maintenance.</Li>
          <Li>Les périodes de maintenance planifiée sont exclues du calcul du taux de disponibilité mensuel.</Li>
        </ul>
      </div>

      {/* 4. Limitation de Responsabilité */}
      <div style={s.section}>
        <h2 style={s.h2}>4. Limitation de Responsabilité</h2>
        <p style={s.p}>
          Répondly fournit ses services selon une obligation de moyens. Répondly met en œuvre tous
          les efforts raisonnables pour assurer la continuité, la sécurité et la qualité de ses
          services, sans pouvoir garantir un résultat déterminé ni une disponibilité absolue.
        </p>
        <p style={s.p}>
          En cas de manquement avéré aux engagements du présent SLA, la responsabilité totale de
          Répondly est limitée au montant des <strong>3 derniers mois de paiements effectivement
          réglés par le client</strong> au titre de son abonnement.
        </p>
        <div style={{ ...s.highlight, borderLeft: `3px solid ${C.blue}` }}>
          <p style={{ ...s.p, margin: 0, fontWeight: 600, color: C.ink }}>Plafond d&apos;indemnisation</p>
          <p style={{ ...s.p, margin: '8px 0 0 0', marginBottom: 0 }}>
            La responsabilité totale de Répondly, tous chefs de préjudice confondus, ne pourra
            excéder le montant cumulé des paiements effectués par le client au cours des
            3 mois précédant l&apos;événement générateur du dommage.
          </p>
        </div>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          En aucun cas Répondly ne pourra être tenu responsable de dommages indirects, de pertes
          d&apos;exploitation, de manque à gagner ou de préjudice commercial résultant d&apos;une
          interruption de service.
        </p>
      </div>

      {/* 5. Exclusions de Responsabilité */}
      <div style={s.section}>
        <h2 style={s.h2}>5. Exclusions de Responsabilité</h2>
        <p style={s.p}>
          Répondly ne peut être tenu responsable des interruptions ou dégradations de service
          résultant des causes suivantes :
        </p>
        <ul style={s.ul}>
          <Li>
            <strong>Meta (WhatsApp Cloud API)</strong> — pannes, limitations, modifications ou
            interruptions de l&apos;API WhatsApp Cloud imposées par Meta Platforms, Inc.
          </Li>
          <Li>
            <strong>Contabo</strong> — incidents d&apos;infrastructure, pannes réseau ou
            interruptions affectant les serveurs d&apos;hébergement de Contabo.
          </Li>
          <Li>
            <strong>Force majeure</strong> — tout événement imprévisible et irrésistible
            indépendant de la volonté de Répondly (catastrophe naturelle, conflit, cyberattaque
            massive, décision gouvernementale, etc.).
          </Li>
          <Li>Défaillances des réseaux de télécommunication ou de l&apos;accès Internet du client.</Li>
          <Li>Actions ou omissions du client ou de tiers non mandatés par Répondly.</Li>
        </ul>
      </div>

      {/* 6. Dépendance aux Données Client */}
      <div style={s.section}>
        <h2 style={s.h2}>6. Dépendance aux Données Client</h2>
        <p style={s.p}>
          Les performances du bot IA de Répondly dépendent directement de la <strong>qualité,
          de l&apos;exhaustivité et de la pertinence des données fournies par le client</strong>{' '}
          lors de la phase de configuration (instructions, base de connaissances, scénarios de
          conversation).
        </p>
        <p style={s.p}>
          Répondly ne peut garantir la pertinence des réponses générées si les données de
          configuration sont incomplètes, inexactes ou insuffisamment représentatives des cas
          d&apos;usage réels du client.
        </p>
        <p style={{ ...s.p, marginBottom: 0 }}>
          Il appartient au client de maintenir et mettre à jour régulièrement sa base de
          connaissances afin d&apos;assurer des performances optimales du bot. Répondly propose
          des sessions d&apos;optimisation sur demande dans le cadre des plans Pro et Business.
        </p>
      </div>

      {/* 7. Exclusions du SLA */}
      <div style={s.lastSection}>
        <h2 style={s.h2}>7. Cas Non Couverts par le SLA</h2>
        <p style={s.p}>
          Les situations suivantes sont explicitement exclues du périmètre du présent SLA et
          ne donnent lieu à aucune compensation :
        </p>
        <ul style={s.ul}>
          <Li>Mauvaise configuration du bot ou des scénarios par le client ou un tiers mandaté par le client.</Li>
          <Li>Dépassement des limites de l&apos;API Meta (quotas de messages, limites de débit, restrictions de compte WhatsApp Business).</Li>
          <Li>Suspension ou restriction du compte WhatsApp Business du client par Meta.</Li>
          <Li>Interruptions dues à des modifications non concertées apportées par le client à son environnement technique.</Li>
          <Li>Non-paiement ou retard de paiement entraînant la suspension du service.</Li>
          <Li>Période d&apos;essai ou accès offert à titre gratuit.</Li>
          <Li>Incidents signalés plus de 30 jours après leur survenance.</Li>
        </ul>
      </div>
    </LegalShell>
  )
}
