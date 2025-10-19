"use client"

import { Box, Container } from "@chakra-ui/react"

import WeaveNavbar from "@/components/Common/WeaveNavbar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Box minH="100vh" bg="#000000">
      <WeaveNavbar />
      <Container maxW="container.xl" py={8}>
        {children}
      </Container>
    </Box>
  )
}
