"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import BottomSheet from "@/components/ui/BottomSheet"
import { Plus, Trash2, Edit2, X, Calendar, Tag, Clock, MessageSquare } from "lucide-react"

type ExceptionType = "CLOSURE" | "PROMO" | "TEMP_HOURS" | "CUSTOM_MESSAGE"

interface ExceptionForm {
  id?: string
  type: ExceptionType
  label: string
  startDate: string
  endDate: string
  closedAllDay: boolean
  openTime: string
  closeTime: string
  customMessage: string
}

const TYPE_CONFIG: Record<
  ExceptionType,
  { label: string; icon: React.ReactNode; desc: string }
> = {
  CLOSURE: {
    label: "Fermeture exceptionnelle",
    icon: <Calendar size={20} />,
    desc: "Indiquez une période de fermeture",
  },
  PROMO: {
    label: "Promotion / Offre spéciale",
    icon: <Tag size={20} />,
    desc: "Annoncez une promotion",
  },
  TEMP_HOURS: {
    label: "Changement d'horaires temporaire",
    icon: <Clock size={20} />,
    desc: "Modifiez les horaires pour une période",
  },
  CUSTOM_MESSAGE: {
    label: "Message personnalisé",
    icon: <MessageSquare size={20} />,
    desc: "Affichez un message personnalisé",
  },
}

function formatDate(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

function today() {
  return new Date().toISOString().split("T")[0]
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split("T")[0]
}

/* ── ExceptionsTab ────────────────────────────────────────────────────────── */

export function ExceptionsTab({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  const business = data || {}
  const [exceptions, setExceptions] = useState<any[]>(business.scheduleExceptions || [])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetStep, setSheetStep] = useState<"menu" | "form">("menu")
  const [selectedType, setSelectedType] = useState<ExceptionType | null>(null)
  const [form, setForm] = useState<ExceptionForm>({
    type: "CLOSURE",
    label: "",
    startDate: today(),
    endDate: today(),
    closedAllDay: true,
    openTime: "09:00",
    closeTime: "18:00",
    customMessage: "",
  })
  const [saving, setSaving] = useState(false)

  const openMenu = () => {
    setSheetStep("menu")
    setSelectedType(null)
    setSheetOpen(true)
  }

  const openForm = (type: ExceptionType, editForm?: ExceptionForm) => {
    setSelectedType(type)
    if (editForm) {
      setForm({ ...editForm })
    } else {
      const start = today()
      const end = today()
      let label = ""
      let message = ""
      if (type === "CLOSURE") {
        label = "Fermeture exceptionnelle"
        message = `Nous serons fermés du ${formatDate(start)} au ${formatDate(end)}. Nous serons ravis de vous accueillir à partir du ${formatDate(tomorrow())}.`
      } else if (type === "PROMO") {
        label = "Promo spéciale"
      } else if (type === "TEMP_HOURS") {
        label = "Changement d'horaires"
      } else if (type === "CUSTOM_MESSAGE") {
        label = "Message personnalisé"
      }
      setForm({
        type,
        label,
        startDate: start,
        endDate: end,
        closedAllDay: type === "CLOSURE",
        openTime: "09:00",
        closeTime: "18:00",
        customMessage: message,
      })
    }
    setSheetStep("form")
    setSheetOpen(true)
  }

  const saveException = async () => {
    if (!form.label.trim()) return
    setSaving(true)
    try {
      const url = form.id ? `/api/schedule-exceptions/${form.id}` : "/api/schedule-exceptions"
      const method = form.id ? "PATCH" : "POST"
      const payload: any = {
        label: form.label.trim(),
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        closedAllDay: form.closedAllDay,
        openTime: form.openTime,
        closeTime: form.closeTime,
        customMessage: form.customMessage,
      }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      if (form.id) {
        const updated = exceptions.map((e) => (e.id === form.id ? json.data : e))
        setExceptions(updated)
        onUpdate({ ...business, scheduleExceptions: updated })
      } else {
        const updated = [...exceptions, json.data]
        setExceptions(updated)
        onUpdate({ ...business, scheduleExceptions: updated })
      }
      setSheetOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const deleteException = async (id: string) => {
    const res = await fetch(`/api/schedule-exceptions/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    const updated = exceptions.filter((e) => e.id !== id)
    setExceptions(updated)
    onUpdate({ ...business, scheduleExceptions: updated })
  }

  const startEdit = (exc: any) => {
    openForm(exc.type, {
      id: exc.id,
      type: exc.type,
      label: exc.label,
      startDate: exc.startDate ? new Date(exc.startDate).toISOString().split("T")[0] : today(),
      endDate: exc.endDate ? new Date(exc.endDate).toISOString().split("T")[0] : today(),
      closedAllDay: exc.closedAllDay ?? false,
      openTime: exc.openTime || "09:00",
      closeTime: exc.closeTime || "18:00",
      customMessage: exc.customMessage || "",
    })
  }

  return (
    <div>
      {/* ── Active exceptions list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
        {exceptions.length === 0 && (
          <div
            style={{
              padding: 32,
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--surface-border)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Aucune exception active. Ajoutez une fermeture ou une annonce.
            </p>
          </div>
        )}
        {exceptions.map((exc) => (
          <div
            key={exc.id}
            style={{
              background: "var(--surface-0)",
              border: "1px solid var(--surface-border)",
              borderRadius: "var(--radius-md)",
              padding: 14,
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--brand-primary-soft)",
                color: "var(--brand-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {TYPE_CONFIG[(exc.type as ExceptionType) || "CUSTOM_MESSAGE"]?.icon || <Calendar size={18} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {exc.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {formatDate(exc.startDate)} {exc.startDate !== exc.endDate ? `au ${formatDate(exc.endDate)}` : ""}
              </div>
              {exc.customMessage && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    marginTop: 6,
                    padding: 8,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface-1)",
                  }}
                >
                  {exc.customMessage}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <Button size="icon-xs" variant="ghost" onClick={() => startEdit(exc)}>
                <Edit2 size={14} />
              </Button>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => deleteException(exc.id)}
                style={{ color: "var(--brand-danger)" }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add button ── */}
      <Button
        style={{
          width: "100%",
          height: 44,
          borderRadius: "var(--radius-md)",
          fontSize: 14,
          fontWeight: 600,
        }}
        onClick={openMenu}
      >
        <Plus size={16} style={{ marginRight: 6 }} />
        Ajouter une exception
      </Button>

      {/* ── Bottom Sheet ── */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <div style={{ padding: "0 20px 24px", maxHeight: "80vh", overflowY: "auto" }}>
          {sheetStep === "menu" ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                  Type d'exception
                </span>
                <button
                  onClick={() => setSheetOpen(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(Object.keys(TYPE_CONFIG) as ExceptionType[]).map((type) => {
                  const cfg = TYPE_CONFIG[type]
                  return (
                    <button
                      key={type}
                      onClick={() => openForm(type)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 12px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--surface-border)",
                        background: "var(--surface-0)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "var(--brand-primary-soft)",
                          color: "var(--brand-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {cfg.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{cfg.desc}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
                  {selectedType ? TYPE_CONFIG[selectedType].label : "Exception"}
                </span>
                <button
                  onClick={() => setSheetOpen(false)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Label / Titre */}
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
                    {selectedType === "PROMO" || selectedType === "CUSTOM_MESSAGE" ? "Titre" : "Label"}
                  </label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="Titre..."
                  />
                </div>

                {/* Date range */}
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
                    Période
                  </label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => {
                        const start = e.target.value
                        setForm((f) => ({
                          ...f,
                          startDate: start,
                          endDate: f.endDate < start ? start : f.endDate,
                        }))
                      }}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>au</span>
                    <Input
                      type="date"
                      value={form.endDate}
                      min={form.startDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

                {/* CLOSURE: auto message */}
                {selectedType === "CLOSURE" && (
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
                      Message
                    </label>
                    <Textarea
                      value={form.customMessage}
                      onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
                      placeholder="Message affiché pendant la fermeture..."
                      style={{ minHeight: 80 }}
                    />
                  </div>
                )}

                {/* PROMO: message */}
                {selectedType === "PROMO" && (
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
                      Message (ce que dit le bot)
                    </label>
                    <Textarea
                      value={form.customMessage}
                      onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
                      placeholder="Décrivez l'offre..."
                      style={{ minHeight: 80 }}
                    />
                  </div>
                )}

                {/* TEMP_HOURS: new hours */}
                {selectedType === "TEMP_HOURS" && (
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
                      Nouveaux horaires
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <Input
                        type="time"
                        value={form.openTime}
                        onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>à</span>
                      <Input
                        type="time"
                        value={form.closeTime}
                        onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                )}

                {/* CUSTOM_MESSAGE: message + optional period */}
                {selectedType === "CUSTOM_MESSAGE" && (
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
                      Message complet
                    </label>
                    <Textarea
                      value={form.customMessage}
                      onChange={(e) => setForm({ ...form, customMessage: e.target.value })}
                      placeholder="Votre message personnalisé..."
                      style={{ minHeight: 80 }}
                    />
                  </div>
                )}

                <Button
                  onClick={saveException}
                  disabled={saving || !form.label.trim()}
                  style={{ marginTop: 8, height: 44 }}
                >
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </>
          )}
        </div>
      </BottomSheet>
    </div>
  )
}
