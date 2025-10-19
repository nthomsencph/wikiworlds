"use client"

import {
  Box,
  Container,
  Flex,
  Input,
  Text,
  Button as ChakraButton,
  Switch,
} from "@chakra-ui/react"
import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiArrowLeft, FiSave, FiX, FiSettings } from "react-icons/fi"

import {
  Blocks as BlocksAPI,
  Entries as EntriesAPI,
  EntryTypes as EntryTypesAPI,
  type EntryCreate,
} from "@/client"
import { toaster } from "@/components/ui/toaster"
import SimpleEditor from "@/components/editor/SimpleEditor"
import Dock, { DockItemData } from "@/components/Dock"
import EntryTypeSelector from "@/components/Weaves/EntryTypeSelector"

export default function CreateEntryPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const weaveId = params.weaveId as string
  const worldId = params.worldId as string

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [selectedEntryType, setSelectedEntryType] = useState<{
    id: string
    name: string
  } | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  // Settings panel state
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showTags, setShowTags] = useState(true)
  const [showEntryType, setShowEntryType] = useState(true)
  const settingsPanelRef = useRef<HTMLDivElement>(null)

  // Tags hover state
  const [isTagsAreaHovered, setIsTagsAreaHovered] = useState(false)
  const tagsAreaRef = useRef<HTMLDivElement>(null)

  // Click outside to close settings panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(event.target as Node)
      ) {
        setShowSettingsPanel(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Fetch entry types
  const { data: entryTypesData, isLoading: entryTypesLoading } = useQuery({
    queryFn: () => EntryTypesAPI.listEntryTypes({ weaveId, worldId }),
    queryKey: ["entryTypes", weaveId, worldId],
  })

  const entryTypes = entryTypesData?.data ?? []

  // Set default entry type to "General" when entry types are loaded
  useEffect(() => {
    if (entryTypes.length > 0 && !selectedEntryType) {
      const generalType = entryTypes.find((type) => type.name === "General")
      if (generalType) {
        setSelectedEntryType({ id: generalType.id, name: generalType.name })
      } else {
        // Fallback to first entry type if "General" doesn't exist
        setSelectedEntryType({ id: entryTypes[0].id, name: entryTypes[0].name })
      }
    }
  }, [entryTypes, selectedEntryType])

  // Create entry mutation
  const createMutation = useMutation({
    mutationFn: (data: EntryCreate) =>
      EntriesAPI.createEntry({ weaveId, worldId, requestBody: data }),
    onSuccess: async (entry) => {
      // If there's content, create a block for it
      if (content && content.trim() !== "" && content !== "<p></p>") {
        try {
          await BlocksAPI.bulkCreateBlocks({
            weaveId,
            worldId,
            entryId: entry.id,
            requestBody: {
              blocks: [
                {
                  block_type: "paragraph",
                  content: { html: content },
                  position: 0,
                },
              ],
            },
          })
        } catch (error) {
          console.error("Failed to create blocks:", error)
          // Don't show error to user, entry was created successfully
        }
      }

      toaster.create({
        title: "Entry created",
        description: `"${entry.title}" has been created successfully.`,
        type: "success",
      })

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["entries", weaveId, worldId] })
      queryClient.invalidateQueries({
        queryKey: ["allEntries", weaveId, worldId],
      })

      // Navigate to the new entry
      router.push(`/weaves/${weaveId}/worlds/${worldId}/entries/${entry.id}`)
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to create entry",
        description:
          error.message || "An error occurred while creating the entry.",
        type: "error",
      })
    },
  })

  const handleSave = () => {
    if (!title.trim()) {
      toaster.create({
        title: "Title required",
        description: "Please enter a title for the entry.",
        type: "error",
      })
      return
    }

    // Entry type is required by the backend
    if (!selectedEntryType) {
      toaster.create({
        title: "Entry type required",
        description: "Please select an entry type.",
        type: "error",
      })
      return
    }

    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")

    createMutation.mutate({
      title,
      slug,
      icon: null,
      entry_type_id: selectedEntryType.id,
      parent_id: null,
      cover_image: coverImage || null,
      tags,
    })
  }

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags((prev) => [...prev, trimmedTag])
    }
    setTagInput("")
  }

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  // Dock items
  const dockItems: DockItemData[] = [
    {
      icon: <FiArrowLeft size={20} />,
      label: "Back",
      onClick: () => router.push(`/weaves/${weaveId}/worlds/${worldId}`),
    },
    {
      icon: <FiSettings size={20} />,
      label: "Settings",
      onClick: () => setShowSettingsPanel(!showSettingsPanel),
    },
    {
      icon: <FiSave size={20} />,
      label: "Save",
      onClick: handleSave,
      className: !title.trim() || !content.trim() ? "dock-item-disabled" : "",
    },
  ]

  return (
    <>
      <Container maxW="container.xl" py={8} pb={32}>
        {/* Layout Container */}
        <Box position="relative" maxW="1200px" mx="auto">
          {/* Single Column Layout - Centered */}
          <Box maxW="800px" mx="auto">
            {/* Cover Image */}
            {coverImage && (
              <Box mb={4} borderRadius="2xl" overflow="hidden">
                <img
                  src={coverImage}
                  alt="Cover"
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              </Box>
            )}

            {/* Tags and Entry Type Row - Above Title */}
            {(showTags || showEntryType) && (
              <Flex
                justify="space-between"
                align="center"
                mb={1}
                minH="45px"
                gap={4}
              >
                {/* Tags - Left Side */}
                {showTags && (
                  <Box
                    ref={tagsAreaRef}
                    flex="1"
                    onMouseEnter={() => setIsTagsAreaHovered(true)}
                    onMouseLeave={() => setIsTagsAreaHovered(false)}
                    px={2}
                    py={0}
                    borderRadius="lg"
                    transition="background 0.2s"
                    _hover={{ bg: "rgba(255, 255, 255, 0.02)" }}
                  >
                    <Flex gap={2} wrap="wrap" align="center" minH="32px">
                      {tags.map((tag) => (
                        <Flex
                          key={tag}
                          align="center"
                          gap={1}
                          bg="rgba(70, 50, 120, 0.3)"
                          color="gray.200"
                          borderRadius="full"
                          px={3}
                          py={1}
                          fontSize="sm"
                        >
                          <Text>{tag}</Text>
                          <ChakraButton
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeTag(tag)
                            }}
                            minW="auto"
                            h="auto"
                            p={1}
                            color="gray.400"
                            _hover={{ color: "white" }}
                          >
                            <FiX size={14} />
                          </ChakraButton>
                        </Flex>
                      ))}

                      {/* Tag Input - Only shows on hover */}
                      {isTagsAreaHovered && (
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          onBlur={() => tagInput && addTag(tagInput)}
                          placeholder="Add tag..."
                          size="sm"
                          bg="transparent"
                          border="none"
                          borderRadius="full"
                          color="white"
                          px={3}
                          w="150px"
                          _placeholder={{ color: "rgba(255, 255, 255, 0.4)" }}
                          _hover={{ border: "none" }}
                          _focus={{
                            outline: "none",
                            border: "none",
                            boxShadow: "none",
                          }}
                        />
                      )}
                    </Flex>
                  </Box>
                )}

                {/* Entry Type - Right Side */}
                {showEntryType && (
                  <EntryTypeSelector
                    entryTypes={entryTypes}
                    selectedEntryType={selectedEntryType}
                    onSelect={setSelectedEntryType}
                    placeholder="Select entry type..."
                    weaveId={weaveId}
                    worldId={worldId}
                  />
                )}
              </Flex>
            )}

            {/* Title */}
            <Box mb={6}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled"
                size="lg"
                bg="transparent"
                border="none"
                color="white"
                fontSize="3xl"
                fontWeight="bold"
                _placeholder={{ color: "rgba(255, 255, 255, 0.2)" }}
                _focus={{ outline: "none" }}
              />
            </Box>

            {/* Editor */}
            <Box bg="transparent" minH="500px" color="white">
              <SimpleEditor content={content} onChange={setContent} />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Settings Panel - Drop-up above dock */}
      {showSettingsPanel && (
        <Box
          ref={settingsPanelRef}
          position="fixed"
          bottom="100px"
          left="50%"
          transform="translateX(-50%)"
          bg="rgba(20, 20, 20, 0.95)"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          p={6}
          border="1px solid rgba(255, 255, 255, 0.1)"
          boxShadow="0 8px 32px rgba(0, 0, 0, 0.5)"
          zIndex={999}
          minW="350px"
        >
          {/* Cover Image URL */}
          <Box mb={4}>
            <Text fontSize="xs" fontWeight="medium" color="white" mb={2}>
              Cover Image URL
            </Text>
            <Input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              size="sm"
              bg="rgba(255, 255, 255, 0.05)"
              borderRadius="xl"
              color="white"
              _placeholder={{ color: "rgba(255, 255, 255, 0.3)" }}
              _focus={{
                outline: "none",
              }}
            />
          </Box>

          {/* Toggle Tags */}
          <Box mb={3}>
            <Switch.Root
              checked={showTags}
              onCheckedChange={(e) => setShowTags(!!e.checked)}
              colorPalette="teal"
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label fontSize="xs" color="white">
                Show Tags
              </Switch.Label>
            </Switch.Root>
          </Box>

          {/* Toggle Entry Type */}
          <Box>
            <Switch.Root
              checked={showEntryType}
              onCheckedChange={(e) => setShowEntryType(!!e.checked)}
              colorPalette="teal"
            >
              <Switch.HiddenInput />
              <Switch.Control />
              <Switch.Label fontSize="xs" color="white">
                Show Entry Type
              </Switch.Label>
            </Switch.Root>
          </Box>
        </Box>
      )}

      {/* Fixed Dock at bottom */}
      <Box
        position="fixed"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        zIndex={1000}
      >
        <Dock items={dockItems} />
      </Box>
    </>
  )
}
