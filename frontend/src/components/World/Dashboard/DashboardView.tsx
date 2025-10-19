"use client"

import { Box, Heading, Text } from "@chakra-ui/react"
import Masonry from "@/components/Masonry"

interface DashboardViewProps {
  isLoading: boolean
  entries: any[]
  weaveId: string
  worldId: string
}

export const DashboardView = ({
  isLoading,
  entries,
  weaveId,
  worldId,
}: DashboardViewProps) => {
  const masonryItems = entries.map((entry) => ({
    id: entry.id,
    img: entry.cover_image || "/assets/images/default-world.png",
    url: `/weaves/${weaveId}/worlds/${worldId}/entries/${entry.id}`,
    title: entry.title,
    entryTypeName: entry.entry_type_name || undefined,
    updatedAt: entry.updated_at,
    characterCount: entry.character_count ?? undefined,
  }))

  return (
    <Box height="100%" mx="auto" maxW="90%">
      {isLoading ? (
        <Text color="gray.300">Loading entries...</Text>
      ) : entries.length === 0 ? (
        <Box textAlign="center" py={16} borderRadius="3xl">
          <Text fontSize="4xl" mb={4}>
            📝
          </Text>
          <Heading size="md" mb={2} color="white">
            No entries found
          </Heading>
          <Text color="gray.300" mb={6}>
            Create your first entry to start building your world
          </Text>
        </Box>
      ) : (
        <Box height="100%" overflowY="auto" overflowX="hidden">
          <Masonry items={masonryItems} />
        </Box>
      )}
    </Box>
  )
}

export type { DashboardViewProps }
