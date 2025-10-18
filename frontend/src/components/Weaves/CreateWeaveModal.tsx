"use client"

import { Box, Flex, Heading, Input, Text, Textarea } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FiAlertCircle } from "react-icons/fi"

import { Weaves as WeavesAPI, type WeaveCreate } from "@/client"
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

interface CreateWeaveModalProps {
  isOpen: boolean
  onClose: () => void
  isRequired?: boolean // If true, this is the first weave and user can't dismiss
}

export default function CreateWeaveModal({
  isOpen,
  onClose,
  isRequired = false,
}: CreateWeaveModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("")
  const [error, setError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (data: WeaveCreate) =>
      WeavesAPI.createWeave({ requestBody: data }),
    onSuccess: (newWeave) => {
      queryClient.invalidateQueries({ queryKey: ["weaves"] })
      // Reset form
      setName("")
      setSlug("")
      setDescription("")
      setIcon("")
      setError(null)
      onClose()
      // Redirect to the newly created weave
      router.push(`/weaves/${newWeave.id}`)
    },
    onError: (err: any) => {
      setError(err.body?.detail || "Failed to create weave. Please try again.")
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
      setError("Weave name is required")
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
      subscription_tier: "free",
    })
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => {
        // Only allow closing if not required
        if (!isRequired && !e.open) {
          onClose()
        }
      }}
      closeOnInteractOutside={!isRequired}
      closeOnEscape={!isRequired}
    >
      <DialogContent maxW="lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isRequired ? "Create Your Workspace" : "Create New Weave"}
            </DialogTitle>
            <DialogDescription>
              {isRequired
                ? "Welcome to WikiWorlds! Create your first weave to get started. A weave is your workspace for organizing worlds and entries."
                : "Create a new weave to organize your worldbuilding projects."}
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

              <Field label="Weave Name" required>
                <Input
                  placeholder="My Fantasy World"
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
                  placeholder="my-fantasy-world"
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
                  placeholder="A brief description of your weave..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </Field>

              {isRequired && (
                <Box
                  p={3}
                  bg={{ base: "blue.50", _dark: "blue.900" }}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={{ base: "blue.200", _dark: "blue.700" }}
                >
                  <Text
                    fontSize="sm"
                    color={{ base: "blue.700", _dark: "blue.200" }}
                  >
                    You need to create at least one weave to use WikiWorlds.
                  </Text>
                </Box>
              )}
            </Flex>
          </DialogBody>

          <DialogFooter>
            <Flex gap={2} justify="end" w="full">
              {!isRequired && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                colorPalette="blue"
                loading={createMutation.isPending}
              >
                {isRequired ? "Create & Get Started" : "Create Weave"}
              </Button>
            </Flex>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogRoot>
  )
}
