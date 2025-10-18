"use client"

import { Box, Container, Heading, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

import { Weaves as WeavesAPI } from "@/client"
import CreateWeaveModal from "@/components/Weaves/CreateWeaveModal"

export default function Weaves() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryFn: () => WeavesAPI.listMyWeaves({ skip: 0, limit: 1 }),
    queryKey: ["weaves"],
  })

  const weaves = data?.data ?? []

  // Auto-redirect to first weave if user has one
  useEffect(() => {
    if (!isLoading && weaves.length > 0) {
      router.push(`/weaves/${weaves[0].id}`)
    }
  }, [isLoading, weaves, router])

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
