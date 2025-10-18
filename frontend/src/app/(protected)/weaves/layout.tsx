"use client"

import { Box } from "@chakra-ui/react"

import WeaveNavbar from "@/components/Common/WeaveNavbar"

export default function WeavesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh" bg="#000000">
      <WeaveNavbar />
      <Box>{children}</Box>
    </Box>
  )
}
