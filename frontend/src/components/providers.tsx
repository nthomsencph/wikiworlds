"use client"

import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"
import { CustomProvider } from "./ui/provider"
import { ApiError } from "@/client"
import "@/lib/api" // Configure OpenAPI

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const handleApiError = (error: Error) => {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        // Remove token and redirect to login
        document.cookie =
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT"
        window.location.href = "/login"
      }
    }

    return new QueryClient({
      queryCache: new QueryCache({
        onError: handleApiError,
      }),
      mutationCache: new MutationCache({
        onError: handleApiError,
      }),
    })
  })

  return (
    <CustomProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </CustomProvider>
  )
}
