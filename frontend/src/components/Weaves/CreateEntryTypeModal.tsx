"use client"

import { useState, useEffect } from "react"
import { Box, Input, Text } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { EntryTypes as EntryTypesAPI } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DialogRoot,
  DialogContent,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "@/components/ui/dialog"
import { toaster } from "@/components/ui/toaster"

interface EntryType {
  id: string
  name: string
  icon?: string | null
  parent_id?: string | null
}

interface CreateEntryTypeModalProps {
  isOpen: boolean
  onClose: () => void
  weaveId: string
  worldId: string
  entryTypes: EntryType[]
  initialParentId?: string | null
}

export default function CreateEntryTypeModal({
  isOpen,
  onClose,
  weaveId,
  worldId,
  entryTypes,
  initialParentId = null,
}: CreateEntryTypeModalProps) {
  const queryClient = useQueryClient()

  const [name, setName] = useState("")
  const [parentId, setParentId] = useState<string | null>(initialParentId)

  // Update parentId when initialParentId changes (when modal opens with preselected parent)
  useEffect(() => {
    if (initialParentId !== null) {
      setParentId(initialParentId)
    }
  }, [initialParentId])

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      EntryTypesAPI.createEntryType({
        weaveId,
        worldId,
        requestBody: data,
      }),
    onSuccess: () => {
      toaster.create({
        title: "Entry type created",
        description: `"${name}" has been created successfully.`,
        type: "success",
      })

      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ["entryTypes", weaveId, worldId],
      })

      // Reset form and close
      handleClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to create entry type",
        description:
          error.message || "An error occurred while creating the entry type.",
        type: "error",
      })
    },
  })

  const handleSubmit = () => {
    if (!name.trim()) {
      toaster.create({
        title: "Name required",
        description: "Please enter a name for the entry type.",
        type: "error",
      })
      return
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    createMutation.mutate({
      name: name.trim(),
      slug,
      parent_id: parentId,
    })
  }

  const handleClose = () => {
    setName("")
    setParentId(null)
    onClose()
  }

  // Build full path for the selected parent
  const buildFullPath = (entryTypeId: string | null): string => {
    if (!entryTypeId) return ""

    const path: string[] = []
    let currentId: string | null = entryTypeId

    // Traverse up the hierarchy
    while (currentId) {
      const entryType = entryTypes.find((type) => type.id === currentId)
      if (!entryType) break
      path.unshift(entryType.name)
      currentId = entryType.parent_id || null
    }

    return path.join(" / ")
  }

  const fullPath = buildFullPath(parentId)

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) =>
        !createMutation.isPending && !e.open && handleClose()
      }
      size="md"
    >
      <DialogContent
        bg="rgba(0, 0, 0, 0.98)"
        borderColor="rgba(255, 255, 255, 0.1)"
        borderWidth={1}
        backdropFilter="blur(30px)"
        borderRadius="3xl"
      >
        <DialogBody>
          <Box pt={2} pb={0}>
            {/* Path Display */}
            {fullPath ? (
              <Text color="white" fontSize="sm" mb={4} mr={4}>
                Creating <i>{fullPath}</i> / <i>{name || "..."}</i>
              </Text>
            ) : (
              <Text color="white" fontSize="sm" mb={4}>
                Creating <i>{name || "..."}</i>
              </Text>
            )}

            {/* Name Input - No Label */}
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit()
                }
              }}
              placeholder="e.g., Quests, Artifacts, Deities"
              autoFocus
              bg="rgba(255, 255, 255, 0.05)"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderRadius="full"
              color="white"
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                outline: "none",
              }}
            />
          </Box>
        </DialogBody>

        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button
              colorPalette="black"
              variant="subtle"
              onClick={handleClose}
              disabled={createMutation.isPending}
              size="sm"
              borderRadius="full"
            >
              Cancel
            </Button>
          </DialogActionTrigger>
          <Button
            colorPalette="teal"
            variant="subtle"
            onClick={handleSubmit}
            loading={createMutation.isPending}
            size="sm"
            borderRadius="full"
          >
            Create
          </Button>
        </DialogFooter>

        <DialogCloseTrigger disabled={createMutation.isPending} />
      </DialogContent>
    </DialogRoot>
  )
}
