import LegalShell from '@/components/LegalShell'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — Répondly',
  description:
    'Politique de confidentialité de Répondly : traitement des données personnelles, droits des utilisateurs et conformité à la loi tunisienne n° 2004-63.',
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
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li style={s.li}>
      <span style={s.bullet}>▸</span>
      <span>{children}</span>
    </li>
  )
}

export default function PrivacyPage() {
  return (
    <LegalShell>
      <h1 style={s.h1}>Politique de Confidentialité</h1>
      <p style={s.subtitle}>Dernière mise à jour : 1er juin 2025</p>

      {/* 1. Introduction */}
      <div style={s.section}>
        <h2 style={s.h2}>1. Introduction</h2>
        <p style={s.p}>
          Répondly (auto-entrepreneur enregistré en Tunisie) exploite une plateforme SaaS d'automatisation
          de la messagerie WhatsApp et de prise de rendez-vous. La présente politique décrit la manière dont
          nous collectons, utilisons, conservons et protégeons les données personnelles dans le cadre de nos
          services, conformément à la loi organique tunisienne n° 2004-63 du 27 juillet 2004 relative à la
          protection des données personnelles.
        </p>
      </div>

      {/* 2. Rôle de Sous-traitant */}
      <div style={s.section}>
        <h2 style={s.h2}>2. Rôle de Sous-traitant</h2>
        <p style={s.p}>
          Dans le cadre des services de messagerie et d'automatisation fournis par Répondly, le Client
          demeure le responsable du traitement au sens de la loi organique n° 2004-63 du 27 juillet 2004.
          Répondly agit exclusivement en qualité de sous-traitant et ne traite les données personnelles des
          utilisateurs finaux que sur instruction documentée du Client, dans les limites définies par le
          contrat de prestation de services et le présent document.
        </p>
        <p style={s.p}>
          Le Client est seul responsable de la licéité des traitements qu'il confie à Répondly, notamment
          de l'obtention du consentement des personnes concernées et du respect des finalités déclarées.
        </p>
      </div>

      {/* 3. Bouclier de protection — données sensibles */}
      <div style={s.section}>
        <h2 style={s.h2}>3. Bouclier de Protection — Données Sensibles</h2>
        <p style={s.p}>
          Répondly ne collecte, ne traite et ne stocke <strong>aucune donnée médicale, de santé, biométrique,
          génétique, ni aucune autre donnée sensible</strong> au sens de l'article 2 de la loi n° 2004-63.
        </p>
        <p style={s.p}>
          Les cas d'usage pris en charge (service client, prise de rendez-vous, FAQ automatisée) ne
          nécessitent pas et n'autorisent pas la transmission de telles données via la plateforme. Tout
          Client souhaitant traiter des données sensibles doit obtenir une autorisation préalable de
          l'INPDP et en informer Répondly par écrit avant toute mise en production.
        </p>
      </div>

      {/* 4. Données collectées */}
      <div style={s.section}>
        <h2 style={s.h2}>4. Données Collectées</h2>
        <ul style={s.ul}>
          <Li><strong>Numéros de téléphone WhatsApp</strong> — collectés lors de l'initiation d'une conversation via l'API WhatsApp Cloud (Meta).</Li>
          <Li><strong>Contenu des messages</strong> — conservé pour fournir des réponses contextualisées et assurer la continuité du service.</Li>
          <Li><strong>Données de compte client</strong> — nom, adresse e-mail et informations de facturation des abonnés à la plateforme Répondly.</Li>
          <Li><strong>Données de configuration du bot</strong> — instructions, scénarios et bases de connaissances fournis par le Client.</Li>
        </ul>
      </div>

      {/* 5. Technologies utilisées */}
      <div style={s.section}>
        <h2 style={s.h2}>5. Technologies Utilisées</h2>
        <p style={s.p}>
          Le traitement des messages repose sur les technologies tierces suivantes :
        </p>
        <ul style={s.ul}>
          <Li>
            <strong>API WhatsApp Cloud (Meta)</strong> — acheminement et réception des messages WhatsApp.
            Les données transitent par les serveurs de Meta conformément aux{' '}
            <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noreferrer" style={s.link}>
              politiques de la plateforme Meta
            </a>.
          </Li>
          <Li>
            <strong>API OpenAI</strong> — génération de réponses automatisées par intelligence artificielle.
            Le contenu des messages peut être transmis aux serveurs d'OpenAI à des fins d'inférence.
            OpenAI n'utilise pas les données transmises via l'API pour entraîner ses modèles par défaut.
          </Li>
        </ul>
      </div>

      {/* 6. Transfert International */}
      <div style={s.section}>
        <h2 style={s.h2}>6. Transfert International de Données</h2>
        <p style={s.p}>
          Les serveurs de Répondly sont hébergés chez <strong>Contabo</strong>, prestataire dont les
          infrastructures sont localisées en <strong>Europe</strong> (Union européenne). Les transferts de
          données personnelles vers ces serveurs sont effectués dans le strict respect des recommandations
          de l'<strong>INPDP</strong> (Instance Nationale de Protection des Données Personnelles) relatives
          aux transferts internationaux.
        </p>
        <p style={s.p}>
          Pour les traitements impliquant des sous-traitants établis hors de Tunisie (Meta, OpenAI),
          Répondly s'assure que des garanties appropriées sont en place (clauses contractuelles types,
          politiques de confidentialité conformes) avant tout transfert.
        </p>
      </div>

      {/* 7. Conservation des données */}
      <div style={s.section}>
        <h2 style={s.h2}>7. Conservation des Données</h2>
        <p style={s.p}>
          Les données conversationnelles (historique des échanges WhatsApp) sont conservées pour une
          durée maximale de <strong>12 mois</strong> à compter de la dernière interaction, sauf demande
          de suppression anticipée formulée par le Client ou l'utilisateur final.
        </p>
        <p style={s.p}>
          Les données de compte client sont conservées pendant toute la durée de l'abonnement, puis
          archivées pendant 5 ans à des fins comptables et légales, conformément à la législation
          tunisienne en vigueur.
        </p>
      </div>

      {/* 8. Droits des utilisateurs */}
      <div style={s.section}>
        <h2 style={s.h2}>8. Droits des Utilisateurs</h2>
        <p style={s.p}>
          Conformément à la loi organique n° 2004-63 du 27 juillet 2004, toute personne concernée
          dispose des droits suivants :
        </p>
        <ul style={s.ul}>
          <Li><strong>Droit d'accès</strong> — obtenir confirmation du traitement de vos données et en recevoir une copie.</Li>
          <Li><strong>Droit de rectification</strong> — faire corriger toute donnée inexacte ou incomplète vous concernant.</Li>
          <Li><strong>Droit de suppression</strong> — demander l'effacement de vos données personnelles, sous réserve des obligations légales de conservation.</Li>
          <Li><strong>Droit d'opposition</strong> — vous opposer, pour des motifs légitimes, au traitement de vos données.</Li>
        </ul>
        <p style={{ ...s.p, marginTop: 12 }}>
          Pour exercer ces droits, adressez votre demande à :{' '}
          <a href="mailto:contact@repondly.tn" style={s.link}>contact@repondly.tn</a>.
          Nous nous engageons à répondre dans un délai de 30 jours.
        </p>
      </div>

      {/* 9. Contact légal */}
      <div style={s.section}>
        <h2 style={s.h2}>9. Contact Légal</h2>
        <p style={s.p}>
          Pour toute demande relative à vos données personnelles (accès, rectification, suppression,
          opposition) ou pour toute question concernant la présente politique :
        </p>
        <div style={s.highlight}>
          <p style={{ ...s.p, margin: 0, fontWeight: 600, color: C.ink }}>Répondly</p>
          <p style={{ ...s.p, margin: '4px 0 0 0' }}>
            E-mail :{' '}
            <a href="mailto:contact@repondly.tn" style={s.link}>contact@repondly.tn</a>
          </p>
          <p style={{ ...s.p, margin: '4px 0 0 0', fontSize: 12 }}>
            Réponse garantie sous 30 jours ouvrés.
          </p>
        </div>
      </div>

      {/* 10. Modifications */}
      <div style={s.lastSection}>
        <h2 style={s.h2}>10. Modifications de la Présente Politique</h2>
        <p style={{ ...s.p, margin: 0 }}>
          Répondly se réserve le droit de modifier la présente politique à tout moment. Toute modification
          substantielle sera notifiée aux Clients par e-mail au moins 15 jours avant son entrée en vigueur.
          La poursuite de l'utilisation des services après cette date vaut acceptation de la politique mise
          à jour.
        </p>
      </div>
    </LegalShell>
  )
}
