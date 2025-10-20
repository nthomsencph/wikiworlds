"use client"

import {
  Box,
  Flex,
  Heading,
  Input,
  Text,
  Textarea,
  Stack,
  Steps,
  Checkbox,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FiAlertCircle, FiUsers } from "react-icons/fi"

import { Worlds as WorldsAPI, type WorldCreate } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import {
  DialogRoot,
  DialogContent,
  DialogBody,
  DialogFooter,
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
  // Start at step 0 (Core fields)
  const [currentStep, setCurrentStep] = useState(0)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("")
  const [coverImage, setCoverImage] = useState("")
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
      setCoverImage("")
      setIsPublic(false)
      setError(null)
      setCurrentStep(0)
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

  const handleNext = () => {
    setError(null)

    // Validation for step 0 (Name and Description)
    if (currentStep === 0) {
      if (!name.trim()) {
        setError("World name is required")
        return
      }
    }

    // Validation for step 1 (Icon and Slug)
    if (currentStep === 1) {
      if (!slug.trim()) {
        setError("Slug is required")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setError(null)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = () => {
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
      cover_image: coverImage.trim() || null,
      is_public: isPublic,
      is_template: false,
    })
  }

  const steps = [
    {
      title: "Core",
      description: (
        <Stack gap={4}>
          <Field label="Name" required>
            <Input
              placeholder="Middle Earth"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
              borderRadius="full"
            />
          </Field>

          <Field label="Description">
            <Textarea
              placeholder="A brief description of your world..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              borderRadius="2xl"
            />
          </Field>
        </Stack>
      ),
    },
    {
      title: "Misc.",
      description: (
        <Stack gap={4}>
          <Field label="Icon">
            <Input
              placeholder="🌍"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              borderRadius="full"
            />
          </Field>

          <Field
            label="Cover Image"
            helperText="URL to a cover image for this world (optional)"
          >
            <Input
              placeholder="https://example.com/image.jpg"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              borderRadius="full"
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
              borderRadius="full"
            />
          </Field>
        </Stack>
      ),
    },
    {
      title: "Settings",
      description: (
        <Stack gap={4}>
          <Field>
            <Flex align="center" gap={2}>
              <Checkbox.Root
                checked={isPublic}
                onCheckedChange={({ checked }) => setIsPublic(Boolean(checked))}
                colorPalette="teal"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control borderRadius="full" />
                <Checkbox.Label>
                  Make this world public{" "}
                  <Box as="span" color="gray.500">
                    (Public worlds can be viewed by anyone via the URL)
                  </Box>
                </Checkbox.Label>
              </Checkbox.Root>
            </Flex>
          </Field>
        </Stack>
      ),
    },
    {
      title: "Invite",
      description: (
        <Box p={8} textAlign="center">
          <Flex justify="center" mb={4}>
            <Box
              p={4}
              bg={{ base: "teal.100", _dark: "teal.800" }}
              borderRadius="full"
            >
              <FiUsers size={32} />
            </Box>
          </Flex>
          <Heading
            size="md"
            mb={2}
            color={{ base: "gray.900", _dark: "gray.100" }}
          >
            Collaboration Coming Soon!
          </Heading>
        </Box>
      ),
    },
  ]

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => {
        if (!e.open) {
          onClose()
        }
      }}
    >
      <DialogContent
        maxW="2xl"
        bg={{ base: "white", _dark: "black" }}
        borderWidth={1}
        borderColor={{ base: "gray.200", _dark: "gray.800" }}
        borderRadius="2xl"
      >
        <DialogBody pt={6}>
          <Steps.Root
            step={currentStep}
            count={steps.length}
            colorPalette="teal"
          >
            {/* Steps Progress Bar */}
            <Box display="flex" justifyContent="center" mb={8}>
              <Steps.List w="70%">
                {steps.map((step, index) => (
                  <Steps.Item key={index} index={index}>
                    <Steps.Indicator />
                    <Steps.Title
                      color={{ base: "gray.900", _dark: "gray.100" }}
                    >
                      {step.title}
                    </Steps.Title>
                    <Steps.Separator
                      bg={{ base: "gray.200", _dark: "gray.600" }}
                      _complete={{ bg: "teal.900" }}
                    />
                  </Steps.Item>
                ))}
              </Steps.List>
            </Box>

            {/* Error Display */}
            {error && (
              <Box
                mb={4}
                p={3}
                bg={{ base: "red.50", _dark: "red.900" }}
                borderRadius="lg"
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

            {/* Step Content */}
            <Box minH="200px">
              {steps.map((step, index) => (
                <Steps.Content key={index} index={index}>
                  {step.description}
                </Steps.Content>
              ))}
            </Box>
          </Steps.Root>
        </DialogBody>

        <DialogFooter>
          <Flex gap={2} justify="space-between" w="full">
            <Box>
              {currentStep === 0 && (
                <Button colorPalette="gray" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </Box>
            <Flex gap={2}>
              {currentStep > 0 && (
                <Button
                  colorPalette="gray"
                  variant="outline"
                  onClick={handlePrev}
                  disabled={createMutation.isPending}
                >
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  colorPalette="teal"
                  onClick={handleNext}
                  disabled={createMutation.isPending}
                >
                  Next
                </Button>
              ) : (
                <Button
                  colorPalette="teal"
                  onClick={handleSubmit}
                  loading={createMutation.isPending}
                >
                  Create {name.trim() || "World"}
                </Button>
              )}
            </Flex>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
