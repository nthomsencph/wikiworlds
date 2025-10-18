"use client"

import { Flex } from "@chakra-ui/react"
import { usePathname } from "next/navigation"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Weaves section has its own layout, so skip the sidebar/navbar
  const isWeavesSection = pathname.startsWith("/weaves")

  if (isWeavesSection) {
    return <>{children}</>
  }

  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Flex flex="1" direction="column" p={4} overflowY="auto">
          {children}
        </Flex>
      </Flex>
    </Flex>
  )
}
