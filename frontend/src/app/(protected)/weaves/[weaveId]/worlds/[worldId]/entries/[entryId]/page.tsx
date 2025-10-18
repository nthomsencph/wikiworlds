"use client"

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  Input,
  Separator,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
import { FiCalendar, FiEdit, FiClock } from "react-icons/fi"

import {
  Entries as EntriesAPI,
  EntryTypes as EntryTypesAPI,
} from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import Link from "next/link"

export default function EntryDetail() {
  const params = useParams()
  const weaveId = params.weaveId as string
  const worldId = params.worldId as string
  const entryId = params.entryId as string

  const [timelineYear, setTimelineYear] = useState<number | null>(null)

  const { data: entry, isLoading: entryLoading } = useQuery({
    queryFn: () =>
      EntriesAPI.getEntry({
        weaveId,
        worldId,
        entryId,
        timelineYear: timelineYear ?? undefined,
      }),
    queryKey: ["entry", weaveId, worldId, entryId, timelineYear],
  })

  const { data: entryType } = useQuery({
    queryFn: () =>
      EntryTypesAPI.getEntryType({
        weaveId,
        worldId,
        entryTypeId: entry?.entry_type_id ?? "",
      }),
    queryKey: ["entryType", weaveId, worldId, entry?.entry_type_id],
    enabled: !!entry?.entry_type_id,
  })

  const { data: fieldDefinitions } = useQuery({
    queryFn: () =>
      EntryTypesAPI.listFields({
        weaveId,
        worldId,
        entryTypeId: entry?.entry_type_id ?? "",
      }),
    queryKey: ["fieldDefinitions", weaveId, worldId, entry?.entry_type_id],
    enabled: !!entry?.entry_type_id,
  })

  if (entryLoading || !entry) {
    return (
      <Container maxW="full">
        <Text mt={8}>Loading...</Text>
      </Container>
    )
  }

  const fields = fieldDefinitions?.data ?? []
  const fieldValues = entry.field_values ?? {}

  return (
    <Container maxW="full">
      {/* Entry Header */}
      <Flex align="start" gap={4} pt={8}>
        {entry.icon && <Text fontSize="5xl">{entry.icon}</Text>}
        <Box flex={1}>
          <Flex align="center" gap={3} mb={2}>
            <Heading size="xl">{entry.title}</Heading>
            {entryType && (
              <Badge colorPalette="blue">
                {entryType.settings?.default_icon as string} {entryType.name}
              </Badge>
            )}
          </Flex>

          {/* Timeline Information */}
          {(entry.timeline_start_year || entry.timeline_end_year) && (
            <Flex align="center" gap={2} fontSize="sm" color="gray.600">
              <FiCalendar />
              <Text>
                Existed: {entry.timeline_start_year ?? "Unknown"} -{" "}
                {entry.timeline_is_ongoing
                  ? "present"
                  : entry.timeline_end_year ?? "Unknown"}
                {entry.timeline_is_circa && " (circa)"}
                {entry.timeline_display_override && (
                  <Text as="span"> • {entry.timeline_display_override}</Text>
                )}
              </Text>
            </Flex>
          )}

          <Flex gap={2} mt={4}>
            <Button size="sm" variant="outline">
              <FiEdit />
              Edit Entry
            </Button>
            <Button size="sm" variant="outline">
              <FiClock />
              View History
            </Button>
          </Flex>
        </Box>
      </Flex>

      <Separator my={8} />

      {/* Timeline Filter for Field Values */}
      <Box
        mb={8}
        p={4}
        borderWidth={1}
        borderRadius="md"
        bg="transparent"
      >
        <Field label="View field values at specific year">
          <Flex gap={2} align="center">
            <FiCalendar />
            <Input
              type="number"
              placeholder="Enter year (e.g., 3000)"
              value={timelineYear ?? ""}
              onChange={(e) => {
                const val = e.target.value
                setTimelineYear(val ? parseInt(val) : null)
              }}
              maxW="300px"
            />
            {timelineYear !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTimelineYear(null)}
              >
                Clear
              </Button>
            )}
          </Flex>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {timelineYear
              ? `Showing field values as they were in year ${timelineYear}`
              : "Showing current field values"}
          </Text>
        </Field>
      </Box>

      {/* Field Values */}
      <Heading size="md" mb={6}>
        Field Values
        {timelineYear && (
          <Text as="span" fontSize="sm" fontWeight="normal" color="gray.600" ml={2}>
            (Year {timelineYear})
          </Text>
        )}
      </Heading>

      {fields.length === 0 ? (
        <Box
          p={8}
          borderWidth={1}
          borderRadius="md"
          textAlign="center"
          color="gray.600"
        >
          <Text>
            No field definitions for this entry type.
          </Text>
          <Text fontSize="sm" mt={2}>
            Add fields to the entry type to start tracking data.
          </Text>
        </Box>
      ) : (
        <Box>
          {fields.map((field) => {
            const value = fieldValues[field.id]
            const hasValue = value !== undefined && value !== null

            return (
              <Box
                key={field.id}
                p={4}
                borderWidth={1}
                borderRadius="md"
                mb={3}
                bg={hasValue ? undefined : "transparent"}
              >
                <Flex justify="space-between" align="start" mb={2}>
                  <Box>
                    <Flex align="center" gap={2}>
                      <Text fontWeight="medium">{field.name}</Text>
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
                      <Text fontSize="sm" color="gray.600" mt={1}>
                        {field.description}
                      </Text>
                    )}
                  </Box>
                  <Button size="sm" variant="ghost">
                    <FiEdit />
                  </Button>
                </Flex>

                <Box mt={3}>
                  {hasValue ? (
                    <Box
                      p={3}
                      borderRadius="md"
                      bg={{ base: "blue.50", _dark: "blue.900" }}
                    >
                      <Text fontFamily="mono" fontSize="sm">
                        {JSON.stringify(value, null, 2)}
                      </Text>
                    </Box>
                  ) : (
                    <Text fontSize="sm" color="gray.500" fontStyle="italic">
                      No value set
                      {timelineYear &&
                        field.is_temporal &&
                        " for this year"}
                    </Text>
                  )}
                </Box>

                {field.is_temporal && hasValue && (
                  <Link
                    href={`/weaves/${weaveId}/worlds/${worldId}/entries/${entryId}/fields/${field.id}/history`}
                  >
                    <Button size="sm" variant="ghost" mt={2}>
                      <FiClock />
                      View temporal history
                    </Button>
                  </Link>
                )}
              </Box>
            )
          })}
        </Box>
      )}

      <Flex gap={3} mt={8}>
        <Button variant="outline">
          <FiEdit />
          Edit All Fields
        </Button>
        <Link
          href={`/weaves/${weaveId}/worlds/${worldId}/entry-types/${entry.entry_type_id}`}
        >
          <Button variant="ghost">
            Manage Field Definitions
          </Button>
        </Link>
      </Flex>
    </Container>
  )
}
