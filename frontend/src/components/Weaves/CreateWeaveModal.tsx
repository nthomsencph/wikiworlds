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
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FiAlertCircle, FiUsers } from "react-icons/fi"

import { Weaves as WeavesAPI, type WeaveCreate } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import {
  DialogRoot,
  DialogContent,
  DialogBody,
  DialogFooter,
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
  // Start at step 0 (Welcome) if required (first weave), otherwise skip to step 1
  const [currentStep, setCurrentStep] = useState(isRequired ? 0 : 1)
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
      setCurrentStep(isRequired ? 0 : 1)
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

  const handleNext = () => {
    setError(null)

    // Validation for step 1 (Name and Description)
    if (currentStep === 1) {
      if (!name.trim()) {
        setError("Weave name is required")
        return
      }
    }

    // Validation for step 2 (Icon and Slug)
    if (currentStep === 2) {
      if (!slug.trim()) {
        setError("Slug is required")
        return
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handlePrev = () => {
    setError(null)
    // Don't go back past the starting step (0 for first weave, 1 for additional weaves)
    const minStep = isRequired ? 0 : 1
    setCurrentStep((prev) => Math.max(prev - 1, minStep))
  }

  const handleSubmit = () => {
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

  const steps = [
    {
      title: "Intro",
      description: (
        <Box>
          <Text
            fontSize="md"
            color={{ base: "gray.600", _dark: "gray.300" }}
            lineHeight="tall"
            mb={3}
            fontWeight="semibold"
          >
            Welcome to WikiWorlds!
          </Text>
          <Text
            fontSize="md"
            color={{ base: "gray.600", _dark: "gray.300" }}
            lineHeight="tall"
          >
            To get started, create your first weave. A weave is a multiverse (or
            universe, depending on how you want to interpret it) wherein you can
            create worlds. Think of it as the Cosmere by Brandon Sanderson.
          </Text>
          <Text
            fontSize="md"
            color={{ base: "gray.600", _dark: "gray.300" }}
            lineHeight="tall"
            mt={3}
          >
            A weave is also your workspace for organizing worlds and their
            entries. Think of a cool name and click &apos;Next&apos; to get
            started.
          </Text>
        </Box>
      ),
    },
    {
      title: "Core",
      description: (
        <Stack gap={4}>
          <Field label="Name" required>
            <Input
              placeholder="The Cosmere"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              autoFocus
              borderRadius="full"
            />
          </Field>

          <Field label="Description">
            <Textarea
              placeholder="A sprawling multiverse of interconnected worlds..."
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
              placeholder="🌌"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              maxLength={2}
              borderRadius="full"
            />
          </Field>

          <Field
            label="Slug"
            helperText="Used in URLs. Auto-generated from name."
            required
          >
            <Input
              placeholder="the-cosmere"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              borderRadius="full"
            />
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
        // Only allow closing if not required
        if (!isRequired && !e.open) {
          onClose()
        }
      }}
      closeOnInteractOutside={!isRequired}
      closeOnEscape={!isRequired}
    >
      <DialogContent
        maxW="2xl"
        bg={{ base: "white", _dark: "black" }}
        borderWidth={1}
        borderColor={{ base: "gray.200", _dark: "white" }}
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
            {steps.map((step, index) => (
              <Steps.Content key={index} index={index}>
                {step.description}
              </Steps.Content>
            ))}
          </Steps.Root>
        </DialogBody>

        <DialogFooter>
          <Flex gap={2} justify="space-between" w="full">
            <Box>
              {!isRequired && currentStep === 0 && (
                <Button colorPalette="gray" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </Box>
            <Flex gap={2}>
              {((isRequired && currentStep > 0) ||
                (!isRequired && currentStep > 1)) && (
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
                  Create {name.trim() || "Weave"}
                </Button>
              )}
            </Flex>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}
