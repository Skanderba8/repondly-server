"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, CheckCircle, Loader2, Smile, Briefcase, Zap } from "lucide-react"

type SaveState = "idle" | "saving" | "saved"

function useSectionSave() {
  const [state, setState] = useState<SaveState>("idle")

  const save = async (fn: () => Promise<void>) => {
    setState("saving")
    try {
      await fn()
      setState("saved")
      setTimeout(() => setState("idle"), 2000)
    } catch {
      setState("idle")
      throw new Error("Save failed")
    }
  }

  return { state, save }
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
        <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
        Sauvegarde...
      </span>
    )
  }
  if (state === "saved") {
    return (
      <span style={{ fontSize: 12, color: "var(--brand-success)", display: "flex", alignItems: "center", gap: 4 }}>
        <CheckCircle size={12} />
        Enregistré
      </span>
    )
  }
  return null
}

function SectionCard({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div
      style={{
        background: "var(--surface-0)",
        border: "1px solid var(--surface-border)",
        borderRadius: "var(--radius-md)",
        padding: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  )
}

const PERSONALITIES = [
  {
    key: "warm",
    emoji: <Smile size={24} />,
    title: "Chaleureux & Proche",
    desc: "Le bot parle comme un ami de confiance",
  },
  {
    key: "professional",
    emoji: <Briefcase size={24} />,
    title: "Professionnel",
    desc: "Ton formel et rassurant",
  },
  {
    key: "direct",
    emoji: <Zap size={24} />,
    title: "Concis & Direct",
    desc: "Réponses courtes et efficaces",
  },
]

/* ── BotTab ───────────────────────────────────────────────────────────────── */

export function BotTab({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  const business = data || {}
  const bc = business.botConfig || {}

  const botSave = useSectionSave()

  const saveBotConfig = async (payload: any) => {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ botConfig: payload }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    onUpdate({ ...business, botConfig: { ...bc, ...payload, needsRegen: true } })
  }

  /* ── Bot Active ── */
  const [botActive, setBotActive] = useState(bc.botActive ?? true)

  /* ── Personality ── */
  const [personality, setPersonality] = useState(bc.personality || business.tone || "warm")

  /* ── Messages ── */
  const [greetingMessage, setGreetingMessage] = useState(business.greetingMessage || "")
  const [strictInstructionBlock, setStrictInstructionBlock] = useState(bc.strictInstructionBlock || "")

  /* ── Handover ── */
  const [handoverPhone, setHandoverPhone] = useState(bc.handoverPhone || "")
  const [handoverTriggers, setHandoverTriggers] = useState<string[]>(bc.handoverTriggers || [])
  const [newTrigger, setNewTrigger] = useState("")

  const addTrigger = () => {
    const t = newTrigger.trim()
    if (!t || handoverTriggers.includes(t)) return
    setHandoverTriggers([...handoverTriggers, t])
    setNewTrigger("")
  }

  /* ── FAQs ── */
  const [faqs, setFaqs] = useState<any[]>(business.faqs || [])
  const faqSave = useSectionSave()

  const toggleFaq = async (index: number) => {
    const next = faqs.map((f, i) => (i === index ? { ...f, active: !f.active } : f))
    setFaqs(next)
    const res = await fetch("/api/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ faqs: next.map((f) => ({ id: f.id, active: f.active })) }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    onUpdate({ ...business, faqs: next })
  }

  const updateFaqAnswer = (index: number, value: string) => {
    setFaqs((prev) => prev.map((f, i) => (i === index ? { ...f, answer: value } : f)))
  }

  const saveFaqAnswers = async () => {
    const res = await fetch("/api/faqs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        faqs: faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
      }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    onUpdate({ ...business, faqs })
  }

  return (
    <div>
      {/* ── Bot actif/inactif ── */}
      <SectionCard
        title="Bot actif/inactif"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={botSave.state} />
            <Button
              size="sm"
              onClick={() =>
                botSave.save(() => saveBotConfig({ botActive }))
              }
              disabled={botSave.state === "saving"}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
              Votre bot répond automatiquement
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              Désactivez pour arrêter toutes les réponses automatiques
            </div>
          </div>
          <Switch
            checked={botActive}
            onCheckedChange={(v) => {
              setBotActive(v)
            }}
          />
        </div>
      </SectionCard>

      {/* ── Personnalité ── */}
      <SectionCard
        title="Personnalité"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={botSave.state} />
            <Button
              size="sm"
              onClick={() =>
                botSave.save(() => saveBotConfig({ personality }))
              }
              disabled={botSave.state === "saving"}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PERSONALITIES.map((p) => {
            const active = personality === p.key
            return (
              <button
                key={p.key}
                onClick={() => setPersonality(p.key)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "14px 12px",
                  borderRadius: "var(--radius-md)",
                  border: `1.5px solid ${active ? "var(--brand-primary)" : "var(--surface-border)"}`,
                  background: active ? "var(--brand-primary-soft)" : "var(--surface-0)",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  transition: "border-color 0.15s, background 0.15s",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: active ? "var(--brand-primary)" : "var(--surface-2)",
                    color: active ? "#fff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {p.emoji}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: active ? "var(--brand-primary)" : "var(--text-primary)",
                      marginBottom: 2,
                    }}
                  >
                    {p.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </SectionCard>

      {/* ── Message d'accueil ── */}
      <SectionCard
        title="Message d'accueil"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={botSave.state} />
            <Button
              size="sm"
              onClick={() =>
                botSave.save(async () => {
                  await saveBotConfig({})
                  await fetch("/api/config", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ business: { greetingMessage } }),
                  })
                })
              }
              disabled={botSave.state === "saving"}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <Textarea
          value={greetingMessage}
          onChange={(e) => setGreetingMessage(e.target.value)}
          placeholder="Bonjour ! Comment puis-je vous aider ?"
          style={{ minHeight: 80 }}
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
          Ce message est affiché à la première interaction avec un client.
        </p>
      </SectionCard>

      {/* ── Comportement hors-horaires ── */}
      <SectionCard
        title="Comportement hors-horaires"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={botSave.state} />
            <Button
              size="sm"
              onClick={() =>
                botSave.save(() => saveBotConfig({ strictInstructionBlock }))
              }
              disabled={botSave.state === "saving"}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <Textarea
          value={strictInstructionBlock}
          onChange={(e) => setStrictInstructionBlock(e.target.value)}
          placeholder="Nous sommes actuellement fermés. Vous pouvez laisser un message et nous vous répondrons dès l'ouverture..."
          style={{ minHeight: 80 }}
        />
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
          Ce message est utilisé lorsque le client contacte en dehors des horaires d'ouverture.
        </p>
      </SectionCard>

      {/* ── Transfert humain ── */}
      <SectionCard
        title="Transfert humain"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={botSave.state} />
            <Button
              size="sm"
              onClick={() =>
                botSave.save(() =>
                  saveBotConfig({
                    handoverPhone,
                    handoverTriggers,
                  })
                )
              }
              disabled={botSave.state === "saving"}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Téléphone de transfert
            </label>
            <Input
              value={handoverPhone}
              onChange={(e) => setHandoverPhone(e.target.value)}
              placeholder="+216 XX XXX XXX"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Mots-clés de transfert
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Input
                value={newTrigger}
                onChange={(e) => setNewTrigger(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTrigger()
                  }
                }}
                placeholder="Ajouter un mot-clé..."
                style={{ flex: 1 }}
              />
              <Button size="sm" onClick={addTrigger}>
                <Plus size={14} />
              </Button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {handoverTriggers.map((t, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 10px",
                    borderRadius: 9999,
                    background: "var(--brand-primary-soft)",
                    color: "var(--brand-primary)",
                    fontSize: 12,
                  }}
                >
                  {t}
                  <button
                    onClick={() => setHandoverTriggers(handoverTriggers.filter((_, j) => j !== i))}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--brand-primary)",
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                      fontSize: 14,
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Questions fréquentes ── */}
      <SectionCard
        title="Questions fréquentes"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={faqSave.state} />
            <Button size="sm" onClick={() => faqSave.save(saveFaqAnswers)} disabled={faqSave.state === "saving"}>
              Enregistrer les réponses
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Aucune question fréquente
            </p>
          )}
          {faqs.map((faq, i) => (
            <div
              key={faq.id}
              style={{
                borderRadius: "var(--radius-md)",
                border: `1px solid ${faq.active ? "var(--brand-primary-soft)" : "var(--surface-border)"}`,
                background: faq.active ? "var(--surface-0)" : "var(--surface-1)",
                overflow: "hidden",
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  cursor: "pointer",
                }}
                onClick={() => toggleFaq(i)}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                  {faq.question}
                </span>
                <Switch checked={faq.active} onCheckedChange={() => toggleFaq(i)} />
              </div>
              {faq.active && (
                <div style={{ padding: "0 14px 12px" }}>
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => updateFaqAnswer(i, e.target.value)}
                    placeholder="Réponse par défaut..."
                    style={{ minHeight: 60 }}
                  />
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                    Personnalisez la réponse ou laissez vide pour la réponse par défaut.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
