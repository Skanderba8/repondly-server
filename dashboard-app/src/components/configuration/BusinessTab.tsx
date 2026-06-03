"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, CheckCircle, Loader2 } from "lucide-react"

const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
]

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
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
        {label}
      </label>
      {children}
    </div>
  )
}

/* ── BusinessTab ─────────────────────────────────────────────────────────── */

export function BusinessTab({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  const business = data || {}

  /* ── General Info ────────────────────────────────────────────────────── */
  const [name, setName] = useState(business.name || "")
  const [phone, setPhone] = useState(business.phone || "")
  const [city, setCity] = useState(business.city || "")
  const [description, setDescription] = useState(business.description || "")
  const infoSave = useSectionSave()

  const saveInfo = async () => {
    const res = await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business: { name, phone, city, description },
      }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    onUpdate({ ...business, name, phone, city, description })
  }

  /* ── Services ────────────────────────────────────────────────────────── */
  const [services, setServices] = useState<any[]>(business.services || [])
  const [serviceForm, setServiceForm] = useState<{ id?: string; name: string; price: string; durationMinutes: string } | null>(null)
  const servicesSave = useSectionSave()

  const saveService = async () => {
    if (!serviceForm || !serviceForm.name.trim()) return
    const payload = {
      name: serviceForm.name.trim(),
      price: parseFloat(serviceForm.price) || 0,
      durationMinutes: parseInt(serviceForm.durationMinutes) || 60,
      available: true,
    }
    const url = serviceForm.id ? `/api/services/${serviceForm.id}` : "/api/services"
    const method = serviceForm.id ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)

    if (serviceForm.id) {
      setServices((prev) => prev.map((s) => (s.id === serviceForm.id ? json.data : s)))
      onUpdate({ ...business, services: business.services.map((s: any) => (s.id === serviceForm.id ? json.data : s)) })
    } else {
      setServices((prev) => [...prev, json.data])
      onUpdate({ ...business, services: [...business.services, json.data] })
    }
    setServiceForm(null)
  }

  const deleteService = async (id: string) => {
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    setServices((prev) => prev.filter((s) => s.id !== id))
    onUpdate({ ...business, services: business.services.filter((s: any) => s.id !== id) })
  }

  /* ── Products ──────────────────────────────────────────────────────────── */
  const [products, setProducts] = useState<any[]>(business.products || [])
  const [productForm, setProductForm] = useState<{ id?: string; name: string; price: string } | null>(null)
  const productsSave = useSectionSave()

  const saveProduct = async () => {
    if (!productForm || !productForm.name.trim()) return
    const payload = {
      name: productForm.name.trim(),
      price: parseFloat(productForm.price) || 0,
      available: true,
    }
    const url = productForm.id ? `/api/products/${productForm.id}` : "/api/products"
    const method = productForm.id ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)

    if (productForm.id) {
      setProducts((prev) => prev.map((p) => (p.id === productForm.id ? json.data : p)))
      onUpdate({ ...business, products: business.products.map((p: any) => (p.id === productForm.id ? json.data : p)) })
    } else {
      setProducts((prev) => [...prev, json.data])
      onUpdate({ ...business, products: [...business.products, json.data] })
    }
    setProductForm(null)
  }

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    onUpdate({ ...business, products: business.products.filter((p: any) => p.id !== id) })
  }

  /* ── Schedules ─────────────────────────────────────────────────────────── */
  const [schedules, setSchedules] = useState<any[]>(business.schedules || [])
  const schedulesSave = useSectionSave()

  const upsertSchedule = async (dayOfWeek: number, field: "openTime" | "closeTime" | "closed", value: string | boolean) => {
    const existing = schedules.find((s: any) => s.dayOfWeek === dayOfWeek)

    if (existing?.id) {
      const res = await fetch(`/api/schedules/${existing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      })
      const json = await res.json()
      if (json.success) {
        const updated = schedules.map((s) => (s.dayOfWeek === dayOfWeek ? json.data : s))
        setSchedules(updated)
        onUpdate({ ...business, schedules: updated })
      }
    } else {
      const payload = {
        dayOfWeek,
        openTime: "09:00",
        closeTime: "18:00",
        closed: false,
        ...(field === "openTime" && { openTime: value }),
        ...(field === "closeTime" && { closeTime: value }),
        ...(field === "closed" && { closed: value }),
      }
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        const updated = [...schedules.filter((s) => s.dayOfWeek !== dayOfWeek), json.data].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek
        )
        setSchedules(updated)
        onUpdate({ ...business, schedules: updated })
      }
    }
  }

  return (
    <div>
      {/* ── Informations générales ── */}
      <SectionCard
        title="Informations générales"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={infoSave.state} />
            <Button
              size="sm"
              onClick={() => infoSave.save(saveInfo)}
              disabled={infoSave.state === "saving"}
            >
              Enregistrer
            </Button>
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nom de l'entreprise">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom..." />
          </Field>
          <Field label="Téléphone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+216..." />
          </Field>
          <Field label="Ville">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex: Tunis" />
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre activité..."
              style={{ minHeight: 80 }}
            />
          </Field>
        </div>
      </SectionCard>

      {/* ── Services ── */}
      <SectionCard
        title="Services"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={servicesSave.state} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setServiceForm({ name: "", price: "", durationMinutes: "60" })}
            >
              <Plus size={14} style={{ marginRight: 4 }} />
              Ajouter
            </Button>
          </div>
        }
      >
        {serviceForm && (
          <div
            style={{
              background: "var(--surface-1)",
              borderRadius: "var(--radius-sm)",
              padding: 12,
              marginBottom: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={serviceForm.name}
                onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                placeholder="Nom du service"
                style={{ flex: 1 }}
              />
              <Input
                type="number"
                value={serviceForm.price}
                onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                placeholder="Prix (DT)"
                style={{ width: 100 }}
              />
              <Input
                type="number"
                value={serviceForm.durationMinutes}
                onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                placeholder="Durée (min)"
                style={{ width: 100 }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button size="sm" variant="outline" onClick={() => setServiceForm(null)}>
                Annuler
              </Button>
              <Button size="sm" onClick={() => servicesSave.save(saveService)} disabled={!serviceForm.name.trim()}>
                Enregistrer
              </Button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {services.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Aucun service
            </p>
          )}
          {services.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--surface-border)",
                background: "var(--surface-0)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {s.price} DT{s.durationMinutes ? ` · ${s.durationMinutes} min` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() =>
                    setServiceForm({
                      id: s.id,
                      name: s.name,
                      price: String(s.price),
                      durationMinutes: String(s.durationMinutes || 60),
                    })
                  }
                >
                  Modifier
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => servicesSave.save(() => deleteService(s.id))}
                  style={{ color: "var(--brand-danger)" }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Produits ── */}
      <SectionCard
        title="Produits"
        action={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SaveIndicator state={productsSave.state} />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setProductForm({ name: "", price: "" })}
            >
              <Plus size={14} style={{ marginRight: 4 }} />
              Ajouter
            </Button>
          </div>
        }
      >
        {productForm && (
          <div
            style={{
              background: "var(--surface-1)",
              borderRadius: "var(--radius-sm)",
              padding: 12,
              marginBottom: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Nom du produit"
                style={{ flex: 1 }}
              />
              <Input
                type="number"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                placeholder="Prix (DT)"
                style={{ width: 120 }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button size="sm" variant="outline" onClick={() => setProductForm(null)}>
                Annuler
              </Button>
              <Button size="sm" onClick={() => productsSave.save(saveProduct)} disabled={!productForm.name.trim()}>
                Enregistrer
              </Button>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {products.length === 0 && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
              Aucun produit
            </p>
          )}
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--surface-border)",
                background: "var(--surface-0)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.price} DT</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() =>
                    setProductForm({
                      id: p.id,
                      name: p.name,
                      price: String(p.price),
                    })
                  }
                >
                  Modifier
                </Button>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => productsSave.save(() => deleteProduct(p.id))}
                  style={{ color: "var(--brand-danger)" }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Horaires ── */}
      <SectionCard
        title="Horaires"
        action={<SaveIndicator state={schedulesSave.state} />}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {DAY_LABELS.map((label, idx) => {
            const s = schedules.find((sc: any) => sc.dayOfWeek === idx)
            const closed = s?.closed ?? false
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-1)",
                  border: "1px solid var(--surface-border)",
                }}
              >
                <span
                  style={{
                    width: 80,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>
                <Switch
                  checked={!closed}
                  onCheckedChange={(open) => {
                    const next = !open
                    schedulesSave.save(() => upsertSchedule(idx, "closed", next))
                  }}
                />
                {closed ? (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>Fermé</span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <input
                      type="time"
                      value={s?.openTime || "09:00"}
                      onChange={(e) => schedulesSave.save(() => upsertSchedule(idx, "openTime", e.target.value))}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--surface-border)",
                        background: "var(--surface-0)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>à</span>
                    <input
                      type="time"
                      value={s?.closeTime || "18:00"}
                      onChange={(e) => schedulesSave.save(() => upsertSchedule(idx, "closeTime", e.target.value))}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--surface-border)",
                        background: "var(--surface-0)",
                        color: "var(--text-primary)",
                        fontSize: 13,
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}
