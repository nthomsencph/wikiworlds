"use client"

import { Flex } from "@chakra-ui/react"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
