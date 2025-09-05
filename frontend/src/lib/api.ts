"use client"

import { OpenAPI } from "@/client"

// Configure the API client for Next.js
function configureOpenAPI() {
  // Use environment variable for API URL
  OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  // Configure token retrieval for both client and server
  OpenAPI.TOKEN = async () => {
    if (typeof window !== "undefined") {
      // Client-side: read from localStorage for now (we'll migrate to cookies later)
      return localStorage.getItem("access_token") || ""
    }
    // Server-side: no token available during SSR
    return ""
  }
}

// Initialize the configuration
configureOpenAPI()

export { OpenAPI }
