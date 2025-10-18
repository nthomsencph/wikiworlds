"use client"

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Separator,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { FiPlus, FiEdit, FiClock } from "react-icons/fi"

import { EntryTypes as EntryTypesAPI } from "@/client"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@chakra-ui/react"

export default function EntryTypesManagement() {
  const params = useParams()
  const weaveId = params.weaveId as string
  const worldId = params.worldId as string

  const { data: entryTypesData, isLoading } = useQuery({
    queryFn: () => EntryTypesAPI.listEntryTypes({ weaveId, worldId }),
    queryKey: ["entryTypes", weaveId, worldId],
  })

  const entryTypes = entryTypesData?.data ?? []

  if (isLoading) {
    return (
      <Container maxW="full">
        <Text mt={8}>Loading...</Text>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Flex justify="space-between" align="center" pt={8} mb={8}>
        <Box>
          <Heading size="lg">Entry Types</Heading>
          <Text color="gray.600" mt={1}>
            Manage the types of entries you can create in this world
          </Text>
        </Box>
        <Button>
          <FiPlus />
          Create Entry Type
        </Button>
      </Flex>

      {entryTypes.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>📋</EmptyState.Indicator>
            <EmptyState.Title>No entry types yet</EmptyState.Title>
            <EmptyState.Description>
              Create an entry type to define the structure of your entries
              (e.g., Character, Location, Item).
            </EmptyState.Description>
          </EmptyState.Content>
          <Button>
            <FiPlus />
            Create Entry Type
          </Button>
        </EmptyState.Root>
      ) : (
        <Box>
          {entryTypes.map((type) => (
            <EntryTypeCard
              key={type.id}
              type={type}
              weaveId={weaveId}
              worldId={worldId}
            />
          ))}
        </Box>
      )}
    </Container>
  )
}

function EntryTypeCard({
  type,
  weaveId,
  worldId,
}: {
  type: any
  weaveId: string
  worldId: string
}) {
  const { data: fieldsData } = useQuery({
    queryFn: () =>
      EntryTypesAPI.listFields({ weaveId, worldId, entryTypeId: type.id }),
    queryKey: ["fields", weaveId, worldId, type.id],
  })

  const fields = fieldsData?.data ?? []

  return (
    <Box
      p={6}
      borderWidth={1}
      borderRadius="md"
      mb={4}
      borderColor={type.color ?? "gray.200"}
    >
      <Flex justify="space-between" align="start" mb={4}>
        <Flex align="center" gap={3}>
          {type.icon && <Text fontSize="3xl">{type.icon}</Text>}
          <Box>
            <Flex align="center" gap={2}>
              <Heading size="md">{type.name}</Heading>
              <Text fontSize="sm" color="gray.600">
                ({type.plural_name})
              </Text>
              {type.is_system && (
                <Badge size="sm" colorPalette="gray">
                  System
                </Badge>
              )}
            </Flex>
            {type.description && (
              <Text color="gray.600" mt={1}>
                {type.description}
              </Text>
            )}
          </Box>
        </Flex>
        <Flex gap={2}>
          <Button size="sm" variant="outline" disabled={type.is_system}>
            <FiEdit />
            Edit
          </Button>
        </Flex>
      </Flex>

      <Separator my={4} />

      <Flex justify="space-between" align="center" mb={3}>
        <Heading size="sm">Fields ({fields.length})</Heading>
        <Button size="sm" variant="ghost" disabled={type.is_system}>
          <FiPlus />
          Add Field
        </Button>
      </Flex>

      {fields.length === 0 ? (
        <Box p={4} borderRadius="md" bg="transparent" textAlign="center">
          <Text fontSize="sm" color="gray.600">
            No fields defined. Add fields to capture data for this entry type.
          </Text>
        </Box>
      ) : (
        <Box>
          {fields.map((field, index) => (
            <Box key={field.id} p={3} borderRadius="md" mb={2} bg="transparent">
              <Flex justify="space-between" align="start">
                <Box flex={1}>
                  <Flex align="center" gap={2} mb={1}>
                    <Text fontWeight="medium" fontSize="sm">
                      {field.name}
                    </Text>
                    <Badge size="sm" variant="outline">
                      {field.field_type}
                    </Badge>
                    {field.is_required && (
                      <Badge size="sm" colorPalette="red">
                        Required
                      </Badge>
                    )}
                    {field.is_temporal && (
                      <Badge size="sm" colorPalette="purple">
                        <FiClock />
                        Temporal
                      </Badge>
                    )}
                  </Flex>
                  {field.description && (
                    <Text fontSize="xs" color="gray.600">
                      {field.description}
                    </Text>
                  )}
                  <Flex gap={3} mt={2} fontSize="xs" color="gray.500">
                    <Text>Position: {field.position}</Text>
                    {field.show_in_table && <Text>• Show in table</Text>}
                    {field.show_in_preview && <Text>• Show in preview</Text>}
                  </Flex>
                </Box>
                <Button size="sm" variant="ghost" disabled={type.is_system}>
                  <FiEdit />
                </Button>
              </Flex>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}
