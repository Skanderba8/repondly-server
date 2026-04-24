import LegalShell from '@/components/LegalShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — Répondly',
  description:
    'Conditions générales de vente et d\'utilisation de Répondly : abonnements, facturation, résiliation et droits des clients.',
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
  link: {
    color: C.blue,
    textDecoration: 'none',
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

export default function TermsPage() {
  return (
    <LegalShell>
      <h1 style={s.h1}>Conditions Générales de Vente et d&apos;Utilisation</h1>
      <p style={s.subtitle}>Dernière mise à jour : 1er juin 2025</p>

      {/* 1. Identification */}
      <div style={s.section}>
        <h2 style={s.h2}>1. Identification du Prestataire</h2>
        <p style={s.p}>
          Les présentes Conditions Générales de Vente et d&apos;Utilisation (ci-après « CGV ») régissent
          les relations contractuelles entre <strong>Répondly</strong>, auto-entrepreneur enregistré en
          Tunisie, et tout client souscrivant aux services de la plateforme.
        </p>
        <div style={s.highlight}>
          <p style={{ ...s.p, margin: 0, fontWeight: 600, color: C.ink }}>Répondly</p>
          <p style={{ ...s.p, margin: '4px 0 0 0' }}>Statut : Auto-entrepreneur enregistré en Tunisie</p>
          <p style={{ ...s.p, margin: '4px 0 0 0' }}>
            Contact :{' '}
            <a href="mailto:contact@repondly.tn" style={s.link}>contact@repondly.tn</a>
          </p>
        </div>
        <p style={{ ...s.p, marginTop: 12, marginBottom: 0 }}>
          Toute souscription aux services de Répondly implique l&apos;acceptation pleine et entière des
          présentes CGV. Le client déclare avoir la capacité juridique de contracter.
        </p>
      </div>

      {/* 2. Abonnements */}
      <div style={s.section}>
        <h2 style={s.h2}>2. Abonnements et Tarifs</h2>
        <p style={s.p}>
          Répondly propose les plans d&apos;abonnement mensuels suivants :
        </p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Plan</th>
              <th style={s.th}>Tarif mensuel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.td}><strong>Starter</strong></td>
              <td style={s.td}>49 DT / mois</td>
            </tr>
            <tr>
              <td style={s.td}><strong>Pro</strong></td>
              <td style={s.td}>99 DT / mois</td>
            </tr>
            <tr>
              <td style={s.td}><strong>Business</strong></td>
              <td style={s.td}>199 DT / mois</td>
            </tr>
          </tbody>
        </table>
        <p style={{ ...s.p, marginTop: 14 }}>
          Des <strong>frais de mise en place</strong> (configuration initiale du bot, intégration WhatsApp
          et paramétrage des scénarios) s&apos;ajoutent à l&apos;abonnement mensuel. Ces frais sont communiqués
          au client avant la signature du contrat et font l&apos;objet d&apos;une facturation distincte.
        </p>
        <p style={{ ...s.p, marginBottom: 0 }}>
          Les tarifs sont exprimés en dinars tunisiens (DT), toutes taxes comprises. Répondly se réserve
          le droit de modifier ses tarifs avec un préavis de 30 jours par e-mail.
        </p>
      </div>

      {/* 3. Facturation */}
      <div style={s.section}>
        <h2 style={s.h2}>3. Facturation et Paiement</h2>
        <p style={s.p}>
          Conformément à l&apos;article 53 de la <strong>loi de finances 2026</strong>, toutes les factures
          émises par Répondly sont générées via le système de facturation électronique{' '}
          <strong>TEIF (El Fatoora)</strong>. Le client reçoit sa facture électronique à l&apos;adresse
          e-mail renseignée lors de son inscription.
        </p>
        <p style={s.p}>
          Les paiements sont traités exclusivement via <strong>Konnect</strong>, passerelle de paiement
          tunisienne agréée. Répondly n&apos;a pas accès aux données bancaires du client, qui sont gérées
          directement par Konnect dans le respect des normes de sécurité en vigueur.
        </p>
        <ul style={s.ul}>
          <Li>L&apos;abonnement est facturé mensuellement, à date anniversaire de souscription.</Li>
          <Li>Les frais de mise en place sont facturés en une seule fois, avant le démarrage de la prestation.</Li>
          <Li>Tout retard de paiement peut entraîner la suspension du service après mise en demeure.</Li>
        </ul>
      </div>

      {/* 4. Droit de Rétractation */}
      <div style={s.section}>
        <h2 style={s.h2}>4. Droit de Rétractation</h2>
        <p style={s.p}>
          Le client dispose d&apos;un délai de <strong>10 jours ouvrables</strong> à compter de la date de
          souscription pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à
          payer de pénalités.
        </p>
        <p style={s.p}>
          Pour exercer ce droit, le client doit adresser une demande explicite à{' '}
          <a href="mailto:contact@repondly.tn" style={s.link}>contact@repondly.tn</a>{' '}
          dans le délai imparti.
        </p>
        <div style={{ ...s.highlight, borderLeft: `3px solid ${C.blue}` }}>
          <p style={{ ...s.p, margin: 0, fontWeight: 600, color: C.ink }}>Exception — Frais de configuration du bot</p>
          <p style={{ ...s.p, margin: '8px 0 0 0', marginBottom: 0 }}>
            Conformément à la réglementation applicable aux prestations de services numériques, le droit
            de rétractation est <strong>levé pour les frais de mise en place et de configuration du bot</strong>{' '}
            dès lors que la prestation a commencé avec l&apos;accord exprès du client. Cet accord est
            recueilli lors de la signature du bon de commande ou de l&apos;acceptation du devis.
          </p>
        </div>
      </div>

      {/* 5. Résiliation */}
      <div style={s.section}>
        <h2 style={s.h2}>5. Résiliation</h2>
        <p style={s.p}>
          Le client peut résilier son abonnement <strong>à tout moment</strong>, sans pénalité ni frais
          de résiliation, en adressant sa demande à{' '}
          <a href="mailto:contact@repondly.tn" style={s.link}>contact@repondly.tn</a>.
        </p>
        <p style={s.p}>
          La résiliation prend effet à la <strong>fin de la période de facturation en cours</strong>.
          Le client conserve l&apos;accès à la plateforme jusqu&apos;à cette date. Aucun remboursement
          prorata temporis n&apos;est effectué pour la période restante.
        </p>
        <p style={{ ...s.p, marginBottom: 0 }}>
          Répondly se réserve le droit de résilier le contrat en cas de manquement grave aux présentes
          CGV, après mise en demeure restée sans effet pendant 15 jours.
        </p>
      </div>

      {/* 6. Propriété Intellectuelle */}
      <div style={s.section}>
        <h2 style={s.h2}>6. Propriété Intellectuelle</h2>
        <p style={s.p}>
          La plateforme Répondly, son code source, ses interfaces, ses algorithmes et l&apos;ensemble de
          ses composants techniques sont la propriété exclusive de Répondly et sont protégés par les
          lois tunisiennes et internationales relatives à la propriété intellectuelle.
        </p>
        <p style={s.p}>
          Le <strong>bot configuré par Répondly</strong> — incluant les scénarios de conversation,
          les flux d&apos;automatisation et les paramètres d&apos;intégration — demeure la{' '}
          <strong>propriété de Répondly jusqu&apos;au paiement intégral des frais de mise en place</strong>.
          À compter du règlement complet de ces frais, le client acquiert un droit d&apos;usage non
          exclusif de la configuration réalisée, dans le cadre de son abonnement actif.
        </p>
        <p style={{ ...s.p, marginBottom: 0 }}>
          Les contenus fournis par le client (textes, données de configuration, bases de connaissances)
          restent sa propriété. Le client accorde à Répondly une licence d&apos;utilisation limitée,
          strictement nécessaire à la fourniture des services.
        </p>
      </div>

      {/* 7. Loi Applicable */}
      <div style={s.lastSection}>
        <h2 style={s.h2}>7. Loi Applicable et Juridiction Compétente</h2>
        <p style={s.p}>
          Les présentes CGV sont régies et interprétées conformément au <strong>droit tunisien</strong>.
        </p>
        <p style={{ ...s.p, marginBottom: 0 }}>
          En cas de litige relatif à la formation, l&apos;interprétation ou l&apos;exécution des présentes
          CGV, et à défaut de résolution amiable dans un délai de 30 jours à compter de la notification
          du différend, les parties conviennent de soumettre le litige à la compétence exclusive des{' '}
          <strong>tribunaux compétents de Tunis</strong>.
        </p>
      </div>
    </LegalShell>
  )
}
