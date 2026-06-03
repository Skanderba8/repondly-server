"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BusinessTab } from "@/components/configuration/BusinessTab"
import { BotTab } from "@/components/configuration/BotTab"
import { ExceptionsTab } from "@/components/configuration/ExceptionsTab"

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/config")
      const json = await res.json()
      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error("Failed to load config", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "var(--text-muted)",
          fontSize: 13,
        }}
      >
        Chargement...
      </div>
    )
  }

  return (
    <div style={{ padding: 0, maxWidth: 768, margin: "0 auto" }}>
      <Tabs defaultValue="business">
        <TabsList
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            width: "100%",
            backgroundColor: "var(--surface-0)",
            borderBottom: "1px solid var(--surface-border)",
            borderRadius: 0,
            padding: "0 16px",
            height: 48,
          }}
        >
          <TabsTrigger value="business">Mon Business</TabsTrigger>
          <TabsTrigger value="bot">Bot & Réponses</TabsTrigger>
          <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
        </TabsList>
        <div style={{ padding: 16 }}>
          <TabsContent value="business">
            <BusinessTab data={data} onUpdate={setData} />
          </TabsContent>
          <TabsContent value="bot">
            <BotTab data={data} onUpdate={setData} />
          </TabsContent>
          <TabsContent value="exceptions">
            <ExceptionsTab data={data} onUpdate={setData} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
