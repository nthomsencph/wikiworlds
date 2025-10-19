"use client"

import { Box, Container, Heading, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { Weaves as WeavesAPI } from "@/client"
import useAuth from "@/hooks/useAuth"
import CreateWeaveModal from "@/components/Weaves/CreateWeaveModal"

export default function Weaves() {
  const router = useRouter()
  const { user: currentUser } = useAuth()

  const { data, isLoading } = useQuery({
    queryFn: () => WeavesAPI.listMyWeaves({ skip: 0, limit: 100 }),
    queryKey: ["weaves"],
  })

  const weaves = data?.data ?? []

  // Auto-redirect to user's last accessed weave, or first weave if none
  useEffect(() => {
    if (!isLoading && weaves.length > 0 && currentUser) {
      // Try to use last accessed weave
      let targetWeaveId = null
      if (currentUser.last_accessed_weave_id) {
        const lastAccessedWeave = weaves.find(
          (w) => w.id === currentUser.last_accessed_weave_id
        )
        if (lastAccessedWeave) {
          targetWeaveId = lastAccessedWeave.id
        }
      }
      // Fall back to first weave in the list
      if (!targetWeaveId && weaves.length > 0) {
        targetWeaveId = weaves[0].id
      }
      if (targetWeaveId) {
        router.push(`/weaves/${targetWeaveId}`)
      }
    }
  }, [isLoading, weaves, currentUser, router])

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.600">Loading your workspace...</Text>
      </Container>
    )
  }

  // No weaves - show create modal
  if (weaves.length === 0) {
    return (
      <>
        <Container maxW="container.md" py={24}>
          <Box textAlign="center">
            <Heading size="2xl" mb={4} fontWeight="bold">
              Welcome to WikiWorlds
            </Heading>
            <Text fontSize="lg" color="gray.600" mb={8} maxW="2xl" mx="auto">
              Setting up your workspace...
            </Text>
          </Box>
        </Container>

        <CreateWeaveModal isOpen={true} onClose={() => {}} isRequired={true} />
      </>
    )
  }

  // While redirecting
  return (
    <Container maxW="container.xl" py={12}>
      <Text color="gray.600">Opening your workspace...</Text>
    </Container>
  )
}
