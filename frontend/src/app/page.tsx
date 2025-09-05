"use client"

import { Box, Container, Flex, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import Navbar from "@/components/Common/Navbar"
import Sidebar from "@/components/Common/Sidebar"
import useAuth from "@/hooks/useAuth"
import { isLoggedIn } from "@/hooks/useAuth"

export default function Dashboard() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoggedIn()) {
      // User is not logged in, redirect to login
      router.replace("/login")
    }
  }, [router, mounted])

  // Show loading during SSR and initial mount
  if (!mounted) {
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

  // If not logged in, show loading while redirecting
  if (!isLoggedIn()) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Redirecting to login...
      </div>
    )
  }

  // Dashboard content for logged in users
  return (
    <Flex direction="column" h="100vh">
      <Navbar />
      <Flex flex="1" overflow="hidden">
        <Sidebar />
        <Flex flex="1" direction="column" p={4} overflowY="auto">
          <Container maxW="full">
            <Box pt={12} m={4}>
              <Text fontSize="2xl" truncate maxW="sm">
                Hi, {currentUser?.full_name || currentUser?.email} 👋🏼
              </Text>
              <Text>Welcome back, nice to see you again!</Text>
            </Box>
          </Container>
        </Flex>
      </Flex>
    </Flex>
  )
}
