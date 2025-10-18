import type { Metadata } from "next"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "FastAPI Project",
  description: "Full Stack FastAPI Template",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
