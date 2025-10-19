"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { isLoggedIn } from "@/hooks/useAuth"

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (!isLoggedIn()) {
        // User is not logged in, redirect to login
        router.replace("/login")
      } else {
        // User is logged in, redirect to weaves
        router.replace("/weaves")
      }
    }
  }, [router, mounted])

  // Show loading during SSR and initial mount
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      Loading...
    </div>
  )
}
