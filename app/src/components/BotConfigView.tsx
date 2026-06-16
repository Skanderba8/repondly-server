'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BotConfig } from '@/types'

type BotConfigViewProps = {
  config: BotConfig
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type BotConfigResponse = {
  success: boolean
  data?: BotConfig
}

type BotTestResponse = {
  success: boolean
  data?: {
    response: string
  }
}

const languageOptions = ['français', 'arabe', 'darija']
const modeOptions = ['professionnel', 'amical', 'direct', 'premium']

function createDraft(config: BotConfig): BotConfig {
  return { ...config }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--bg-card)] px-3.5 py-3">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--text-muted)]"
          style={{ animationDelay: `${dot * 120}ms` }}
        />
      ))}
    </div>
  )
}

export function BotConfigView({ config }: BotConfigViewProps) {
  const [draft, setDraft] = useState(() => createDraft(config))
  const [savedConfig, setSavedConfig] = useState(config)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<ChatMessage[]>([])
  const [testing, setTesting] = useState(false)

  const knowledgeCount = draft.botKnowledge.length
  const historyForApi = useMemo(() => history.map((item) => ({ role: item.role, content: item.content })), [history])

  async function saveConfig() {
    setSaving(true)

    try {
      const response = await fetch('/api/bot/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })

      if (!response.ok) {
        throw new Error('BOT_CONFIG_SAVE_FAILED')
      }

      const result = (await response.json()) as BotConfigResponse
      if (result.data) {
        setSavedConfig(result.data)
        setDraft(result.data)
      }
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage() {
    const content = message.trim()
    if (!content || testing) {
      return
    }

    const nextHistory: ChatMessage[] = [...history, { role: 'user', content }]
    setHistory(nextHistory)
    setMessage('')
    setTesting(true)

    try {
      const response = await fetch('/api/bot/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history: historyForApi }),
      })

      if (!response.ok) {
        throw new Error('BOT_TEST_FAILED')
      }

      const result = (await response.json()) as BotTestResponse
      setHistory((current) => [...current, { role: 'assistant', content: result.data?.response ?? '' }])
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="nx-page">
      <header className="nx-page-header">
        <div>
          <p className="nx-section-label">Automatisation</p>
          <h1 className="nx-page-title">Bot IA</h1>
          <p className="nx-page-sub">Configurez le persona, la base de connaissances et testez les reponses avant activation.</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <section className="space-y-4">
          <div className="nx-card p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="nx-section-label">Activation</p>
                <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Reponses automatiques</h2>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.botEnabled}
                className={cn('nx-toggle', draft.botEnabled && 'is-on')}
                onClick={() => setDraft({ ...draft, botEnabled: !draft.botEnabled })}
              >
                <span className="nx-toggle-thumb" />
              </button>
            </div>
            <div className="nx-field mt-4">
              <label className="nx-label" htmlFor="bot-mode">Mode</label>
              <select id="bot-mode" className="nx-input" value={draft.botMode} onChange={(event) => setDraft({ ...draft, botMode: event.target.value })}>
                {modeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <p className="nx-section-label">Persona</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="nx-field">
                <label className="nx-label" htmlFor="bot-name">Nom du bot</label>
                <input id="bot-name" className="nx-input" value={draft.botName} onChange={(event) => setDraft({ ...draft, botName: event.target.value })} placeholder={savedConfig.businessName} />
              </div>
              <div className="nx-field">
                <label className="nx-label" htmlFor="bot-language">Langue</label>
                <select id="bot-language" className="nx-input" value={draft.botLanguage} onChange={(event) => setDraft({ ...draft, botLanguage: event.target.value })}>
                  {languageOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="nx-field mt-3">
              <label className="nx-label" htmlFor="bot-tone">Ton</label>
              <select id="bot-tone" className="nx-input" value={draft.botMode} onChange={(event) => setDraft({ ...draft, botMode: event.target.value })}>
                {modeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <div className="nx-field">
              <label className="nx-label" htmlFor="bot-knowledge">Base de connaissances</label>
              <textarea
                id="bot-knowledge"
                className="nx-input nx-textarea min-h-[220px]"
                maxLength={8000}
                value={draft.botKnowledge}
                onChange={(event) => setDraft({ ...draft, botKnowledge: event.target.value })}
              />
              <p className="mt-2 text-right text-[11px] text-[color:var(--text-muted)]">{knowledgeCount}/8000</p>
            </div>
          </div>

          <div className="nx-card p-4 md:p-5">
            <div className="nx-field">
              <label className="nx-label" htmlFor="bot-handoff">Handoff</label>
              <input id="bot-handoff" className="nx-input" value={draft.botHandoffKeywords} onChange={(event) => setDraft({ ...draft, botHandoffKeywords: event.target.value })} />
              <p className="mt-2 text-[12px] text-[color:var(--text-secondary)]">Mots ou phrases separes par des virgules qui declenchent le transfert a l'equipe.</p>
            </div>
          </div>

          <button type="button" className="nx-btn nx-btn-primary" disabled={saving} onClick={() => void saveConfig()}>
            Sauvegarder
          </button>
        </section>

        <aside className="nx-card flex min-h-[620px] flex-col p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="nx-section-label">Test chat</p>
              <h2 className="mt-1 text-[14px] font-semibold text-[color:var(--text-primary)]">Conversation de test</h2>
            </div>
            <button type="button" className="nx-btn nx-btn-ghost nx-btn-sm" onClick={() => setHistory([])}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Réinitialiser
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-[var(--radius-btn)] border border-[color:var(--border)] bg-[color:var(--bg-page)] p-3">
            {history.map((item, index) => {
              const outbound = item.role === 'user'
              return (
                <div key={`${item.role}-${index}`} className={cn('flex max-w-[82%] flex-col md:max-w-[72%]', outbound ? 'ml-auto items-end' : 'mr-auto items-start')}>
                  <div
                    className={cn(
                      'rounded-[8px] border px-3.5 py-2 text-[13.5px] leading-[1.5]',
                      outbound
                        ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-[color:var(--text-on-brand)]'
                        : 'border-[color:var(--border)] bg-[color:var(--bg-card)] text-[color:var(--text-primary)]',
                    )}
                  >
                    {item.content}
                  </div>
                </div>
              )
            })}
            {testing ? <div className="mr-auto"><TypingDots /></div> : null}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea
              className="nx-input nx-textarea min-h-11 flex-1"
              rows={2}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void sendMessage()
                }
              }}
              placeholder="Ecrire un message"
            />
            <button type="button" className="nx-btn nx-btn-primary nx-btn-icon-md" disabled={testing || !message.trim()} onClick={() => void sendMessage()} aria-label="Envoyer">
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
