"use client"

import { Box, Flex, Input, Text, Textarea } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FiAlertCircle } from "react-icons/fi"

import { Worlds as WorldsAPI, type WorldCreate } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface CreateWorldModalProps {
  isOpen: boolean
  onClose: () => void
  weaveId: string
}

export default function CreateWorldModal({
  isOpen,
  onClose,
  weaveId,
}: CreateWorldModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: WorldCreate) =>
      WorldsAPI.createWorld({ weaveId, requestBody: data }),
    onSuccess: (newWorld) => {
      queryClient.invalidateQueries({ queryKey: ["worlds", weaveId] })
      // Reset form
      setName("")
      setSlug("")
      setDescription("")
      setIcon("")
      setIsPublic(false)
      setError(null)
      onClose()
      // Navigate to the newly created world
      router.push(`/weaves/${weaveId}/worlds/${newWorld.id}`)
    },
    onError: (err: any) => {
      setError(err.body?.detail || "Failed to create world. Please try again.")
    },
  })

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-generate slug if it hasn't been manually edited
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    setSlug(autoSlug)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError("World name is required")
      return
    }

    if (!slug.trim()) {
      setError("Slug is required")
      return
    }

    createMutation.mutate({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      icon: icon.trim() || null,
      is_public: isPublic,
      is_template: false,
    })
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => {
        if (!e.open) {
          onClose()
        }
      }}
    >
      <DialogContent maxW="lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New World</DialogTitle>
            <DialogDescription>
              Create a new world within this weave. A world is a container for
              entries and has its own timeline and entry types.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Flex direction="column" gap={4}>
              {error && (
                <Box
                  p={3}
                  bg={{ base: "red.50", _dark: "red.900" }}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={{ base: "red.200", _dark: "red.700" }}
                >
                  <Flex align="center" gap={2}>
                    <FiAlertCircle color="red" />
                    <Text
                      fontSize="sm"
                      color={{ base: "red.700", _dark: "red.200" }}
                    >
                      {error}
                    </Text>
                  </Flex>
                </Box>
              )}

              <Field label="World Name" required>
                <Input
                  placeholder="Middle Earth"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus
                />
              </Field>

              <Field
                label="Slug"
                helperText="Used in URLs. Auto-generated from name."
                required
              >
                <Input
                  placeholder="middle-earth"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </Field>

              <Field label="Icon" helperText="Single emoji (optional)">
                <Input
                  placeholder="🌍"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  maxLength={2}
                />
              </Field>

              <Field label="Description" helperText="Optional">
                <Textarea
                  placeholder="A brief description of your world..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </Field>

              <Field
                label="Visibility"
                helperText="Public worlds can be viewed by anyone"
              >
                <Flex align="center" gap={2}>
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label htmlFor="is-public">
                    <Text fontSize="sm">Make this world public</Text>
                  </label>
                </Flex>
              </Field>
            </Flex>
          </DialogBody>

          <DialogFooter>
            <Flex gap={2} justify="end" w="full">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                colorPalette="blue"
                loading={createMutation.isPending}
              >
                Create World
              </Button>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
