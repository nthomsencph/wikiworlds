"use client"

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  createTreeCollection,
  useFilter,
  createListCollection,
} from "@chakra-ui/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useMemo, useEffect } from "react"
import { FiPlus, FiCalendar, FiHome, FiSearch, FiShare2 } from "react-icons/fi"
import { LuNetwork } from "react-icons/lu"

import {
  Worlds as WorldsAPI,
  Entries as EntriesAPI,
  EntryTypes as EntryTypesAPI,
  Tags as TagsAPI,
} from "@/client"
import { toaster } from "@/components/ui/toaster"
import Dock, { DockItemData } from "@/components/Dock"
import {
  WorldTreeView,
  DashboardView,
  TimelineView,
  SearchView,
  KnowledgeGraphView,
  DeleteEntryDialog,
  RenameEntryTypeDialog,
  CreateNestedEntryTypeDialog,
  DeleteEntryTypeDialog,
  type TreeNode,
} from "@/components/World"

const PER_PAGE = 25

export default function WorldDetail() {
  const params = useParams()
  const router = useRouter()
  const weaveId = params.weaveId as string
  const worldId = params.worldId as string

  const [page, setPage] = useState(1)
  const [timelineYear, setTimelineYear] = useState<number | null>(null)
  const [entryTypeFilter, setEntryTypeFilter] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<
    "dashboard" | "tree" | "timeline" | "search" | "knowledge-graph"
  >("dashboard")
  const [expandedNodes, setExpandedNodes] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [tagSearchValue, setTagSearchValue] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  // Rename entry type dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [entryTypeToRename, setEntryTypeToRename] = useState<{
    id: string
    name: string
  } | null>(null)
  const [newEntryTypeName, setNewEntryTypeName] = useState("")

  // Create nested entry type dialog state
  const [createNestedDialogOpen, setCreateNestedDialogOpen] = useState(false)
  const [parentEntryType, setParentEntryType] = useState<{
    id: string
    name: string
  } | null>(null)
  const [nestedEntryTypeName, setNestedEntryTypeName] = useState("")

  // Delete entry type dialog state
  const [deleteEntryTypeDialogOpen, setDeleteEntryTypeDialogOpen] =
    useState(false)
  const [entryTypeToDelete, setEntryTypeToDelete] = useState<{
    id: string
    name: string
  } | null>(null)

  const { contains } = useFilter({ sensitivity: "base" })
  const queryClient = useQueryClient()

  const { data: world, isLoading: worldLoading } = useQuery({
    queryFn: () => WorldsAPI.getWorld({ weaveId, worldId }),
    queryKey: ["world", weaveId, worldId],
  })

  const { data: entryTypesData } = useQuery({
    queryFn: () => EntryTypesAPI.listEntryTypes({ weaveId, worldId }),
    queryKey: ["entryTypes", weaveId, worldId],
  })

  const { data: tagsData } = useQuery({
    queryFn: () => TagsAPI.listTags({ weaveId, worldId }),
    queryKey: ["tags", weaveId, worldId],
  })

  const { data: entriesData, isLoading: entriesLoading } = useQuery({
    queryFn: () =>
      EntriesAPI.listEntries({
        weaveId,
        worldId,
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
        timelineYear: timelineYear ?? undefined,
        entryTypeId: entryTypeFilter ?? undefined,
      }),
    queryKey: [
      "entries",
      weaveId,
      worldId,
      { page, timelineYear, entryTypeFilter },
    ],
  })

  // Fetch all entries for tree view (without pagination)
  const { data: allEntriesData, isLoading: allEntriesLoading } = useQuery({
    queryFn: () =>
      EntriesAPI.listEntries({
        weaveId,
        worldId,
        skip: 0,
        limit: 10000, // Large limit to get all entries
      }),
    queryKey: ["allEntries", weaveId, worldId],
    enabled: currentView === "tree", // Only fetch when tree view is active
  })

  const entryTypes = entryTypesData?.data ?? []
  const entries = entriesData?.data ?? []
  const count = entriesData?.count ?? 0
  const allEntries = allEntriesData?.data ?? []
  const tags = tagsData?.data ?? []

  // Delete entry mutation
  const deleteMutation = useMutation({
    mutationFn: (entryId: string) =>
      EntriesAPI.deleteEntry({ weaveId, worldId, entryId }),
    onSuccess: () => {
      toaster.create({
        title: "Entry deleted",
        description: `"${entryToDelete?.name}" has been deleted successfully.`,
        type: "success",
      })
      queryClient.invalidateQueries({ queryKey: ["entries", weaveId, worldId] })
      queryClient.invalidateQueries({
        queryKey: ["allEntries", weaveId, worldId],
      })
      setDeleteDialogOpen(false)
      setEntryToDelete(null)
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to delete entry",
        description:
          error.message || "An error occurred while deleting the entry.",
        type: "error",
      })
    },
  })

  // Handle delete entry
  const handleDeleteEntry = (entryId: string, entryName: string) => {
    setEntryToDelete({ id: entryId, name: entryName })
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete.id)
    }
  }

  // Rename entry type mutation
  const renameMutation = useMutation({
    mutationFn: ({
      entryTypeId,
      newName,
    }: {
      entryTypeId: string
      newName: string
    }) =>
      EntryTypesAPI.updateEntryType({
        weaveId,
        worldId,
        entryTypeId,
        requestBody: { name: newName },
      }),
    onSuccess: () => {
      toaster.create({
        title: "Entry type renamed",
        description: `Entry type renamed to "${newEntryTypeName}" successfully.`,
        type: "success",
      })
      queryClient.invalidateQueries({
        queryKey: ["entryTypes", weaveId, worldId],
      })
      queryClient.invalidateQueries({
        queryKey: ["allEntries", weaveId, worldId],
      })
      setRenameDialogOpen(false)
      setEntryTypeToRename(null)
      setNewEntryTypeName("")
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to rename entry type",
        description:
          error.message || "An error occurred while renaming the entry type.",
        type: "error",
      })
    },
  })

  // Handle rename entry type
  const handleRenameEntryType = (
    entryTypeId: string,
    entryTypeName: string
  ) => {
    setEntryTypeToRename({ id: entryTypeId, name: entryTypeName })
    setNewEntryTypeName(entryTypeName)
    setRenameDialogOpen(true)
  }

  const confirmRename = () => {
    if (entryTypeToRename && newEntryTypeName.trim()) {
      renameMutation.mutate({
        entryTypeId: entryTypeToRename.id,
        newName: newEntryTypeName.trim(),
      })
    }
  }

  // Create nested entry type mutation
  const createNestedMutation = useMutation({
    mutationFn: ({ parentId, name }: { parentId: string; name: string }) => {
      // Generate slug from name (lowercase, replace spaces with hyphens)
      const slug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")

      return EntryTypesAPI.createEntryType({
        weaveId,
        worldId,
        requestBody: {
          name,
          slug,
          parent_id: parentId,
        },
      })
    },
    onSuccess: () => {
      toaster.create({
        title: "Entry type created",
        description: `Nested entry type "${nestedEntryTypeName}" created successfully.`,
        type: "success",
      })
      queryClient.invalidateQueries({
        queryKey: ["entryTypes", weaveId, worldId],
      })
      queryClient.invalidateQueries({
        queryKey: ["allEntries", weaveId, worldId],
      })
      setCreateNestedDialogOpen(false)
      setParentEntryType(null)
      setNestedEntryTypeName("")
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

  // Handle create nested entry type
  const handleCreateNestedEntryType = (
    entryTypeId: string,
    entryTypeName: string
  ) => {
    setParentEntryType({ id: entryTypeId, name: entryTypeName })
    setNestedEntryTypeName("")
    setCreateNestedDialogOpen(true)
  }

  const confirmCreateNested = () => {
    if (parentEntryType && nestedEntryTypeName.trim()) {
      createNestedMutation.mutate({
        parentId: parentEntryType.id,
        name: nestedEntryTypeName.trim(),
      })
    }
  }

  // Delete entry type mutation
  const deleteEntryTypeMutation = useMutation({
    mutationFn: (entryTypeId: string) =>
      EntryTypesAPI.deleteEntryType({ weaveId, worldId, entryTypeId }),
    onSuccess: () => {
      toaster.create({
        title: "Entry type deleted",
        description: `"${entryTypeToDelete?.name}" has been deleted successfully.`,
        type: "success",
      })
      queryClient.invalidateQueries({
        queryKey: ["entryTypes", weaveId, worldId],
      })
      queryClient.invalidateQueries({
        queryKey: ["allEntries", weaveId, worldId],
      })
      setDeleteEntryTypeDialogOpen(false)
      setEntryTypeToDelete(null)
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to delete entry type",
        description:
          error.message || "An error occurred while deleting the entry type.",
        type: "error",
      })
    },
  })

  // Check if an entry type has any entries (direct or in nested children)
  const entryTypeHasEntries = (entryTypeId: string): boolean => {
    // Get all entry type IDs including children recursively
    const getAllChildEntryTypeIds = (typeId: string): string[] => {
      const childIds: string[] = [typeId]
      const childTypes = entryTypes.filter((et) => et.parent_id === typeId)

      childTypes.forEach((child) => {
        childIds.push(...getAllChildEntryTypeIds(child.id))
      })

      return childIds
    }

    const allTypeIds = getAllChildEntryTypeIds(entryTypeId)

    // Check if any entries exist for this type or its children
    return allEntries.some((entry) => allTypeIds.includes(entry.entry_type_id))
  }

  // Handle delete entry type
  const handleDeleteEntryType = (
    entryTypeId: string,
    entryTypeName: string
  ) => {
    setEntryTypeToDelete({ id: entryTypeId, name: entryTypeName })
    setDeleteEntryTypeDialogOpen(true)
  }

  const confirmDeleteEntryType = () => {
    if (entryTypeToDelete && !entryTypeHasEntries(entryTypeToDelete.id)) {
      deleteEntryTypeMutation.mutate(entryTypeToDelete.id)
    }
  }

  // Get all unique tag names from tags data
  const allTagNames = useMemo(() => tags.map((tag) => tag.name), [tags])

  // Filter tags for combobox based on search
  const filteredTags = useMemo(
    () =>
      allTagNames.filter((tag) =>
        tag.toLowerCase().includes(tagSearchValue.toLowerCase())
      ),
    [allTagNames, tagSearchValue]
  )

  // Create combobox collection
  const tagCollection = useMemo(
    () => createListCollection({ items: filteredTags }),
    [filteredTags]
  )

  // Transform entries into Masonry items
  const masonryItems = useMemo(() => {
    return entries.map((entry) => ({
      id: entry.id,
      img: entry.cover_image || "/assets/images/default-world.png",
      url: `/weaves/${weaveId}/worlds/${worldId}/entries/${entry.id}`,
      title: entry.title,
      entryTypeName: entry.entry_type_name || undefined,
      updatedAt: entry.updated_at,
      characterCount: entry.character_count ?? undefined,
    }))
  }, [entries, weaveId, worldId])

  // Build hierarchical tree structure for tree view
  const treeCollection = useMemo(() => {
    // Build hierarchical tree based on entry types
    const entryTypes = entryTypesData?.data || []

    // If no entry types exist, show empty tree
    if (entryTypes.length === 0) {
      return createTreeCollection<TreeNode>({
        nodeToValue: (node) => node.id,
        nodeToString: (node) => node.name,
        rootNode: {
          id: "ROOT",
          name: "",
          children: [],
        },
      })
    }

    // Filter entries by selected tags
    const filteredEntries =
      selectedTags.length === 0
        ? allEntries // Show all if no tags selected
        : allEntries.filter((entry) => {
            // Show entry only if it has ALL selected tags (AND logic)
            return (
              entry.tags &&
              selectedTags.every((tag) => entry.tags!.includes(tag))
            )
          })

    // Group entries by entry type ID
    const entriesByType = new Map<string, typeof allEntries>()
    filteredEntries.forEach((entry) => {
      const typeId = entry.entry_type_id
      if (!entriesByType.has(typeId)) {
        entriesByType.set(typeId, [])
      }
      entriesByType.get(typeId)!.push(entry)
    })

    // Create a map of entry type nodes
    const typeNodesMap = new Map<string, TreeNode>()

    // Create nodes for ALL entry types (even if they have no entries)
    entryTypes.forEach((type) => {
      const entries = entriesByType.get(type.id) || []

      // Convert entries to tree nodes
      const entryNodes: TreeNode[] = entries
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((entry) => ({
          id: entry.id,
          name: entry.title,
          icon: entry.icon,
          entryTypeName: null,
          children: undefined,
          isEntryTypeFolder: false,
        }))

      // Create the type node (always create it, even with no entries)
      typeNodesMap.set(type.id, {
        id: `type-${type.id}`,
        name: type.name,
        icon: null,
        entryTypeName: null,
        children: entryNodes.length > 0 ? entryNodes : undefined,
        childrenCount: entryNodes.length,
        isEntryTypeFolder: true,
        _parentId: type.parent_id, // Temporary field for building hierarchy
      } as TreeNode & { _parentId: string | null })
    })

    // Build parent-child relationships iteratively
    const rootNodes: TreeNode[] = []

    // First pass: Build parent-child relationships
    typeNodesMap.forEach((node, typeId) => {
      const typedNode = node as TreeNode & { _parentId: string | null }
      const parentId = typedNode._parentId

      // Check for circular reference
      if (parentId && parentId === typeId) {
        console.warn(
          `Self-reference detected in entry type: ${node.name} (${typeId})`
        )
        return
      }

      if (parentId !== null) {
        // Child type - add to parent's children
        const parentNode = typeNodesMap.get(parentId) as
          | (TreeNode & { _parentId: string | null })
          | undefined
        if (parentNode) {
          if (!parentNode.children) {
            parentNode.children = []
          }
          parentNode.children.unshift(typedNode) // Add child types before entries
        } else {
          // Parent not found, will be handled as potential root
          console.warn(
            `Parent entry type not found for: ${node.name} (parent_id: ${parentId})`
          )
        }
      }
    })

    // Second pass: Build root nodes (keep ALL entry types, even empty ones)
    typeNodesMap.forEach((node, typeId) => {
      const typedNode = node as TreeNode & { _parentId: string | null }
      const parentId = typedNode._parentId

      // Only process root-level types or types whose parent wasn't found
      if (parentId === null || !typeNodesMap.has(parentId)) {
        delete (typedNode as any)._parentId
        rootNodes.push(typedNode)
      }
    })

    // Clean up any remaining _parentId fields
    typeNodesMap.forEach((node) => {
      delete (node as any)._parentId
    })

    return createTreeCollection<TreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: {
        id: "ROOT",
        name: "",
        children: rootNodes,
      },
    })
  }, [allEntries, entryTypesData, selectedTags, allTagNames])

  // Filter tree collection based on search query
  const filteredTreeCollection = useMemo(() => {
    if (!searchQuery) return treeCollection
    return treeCollection.filter((node) => contains(node.name, searchQuery))
  }, [treeCollection, searchQuery, contains])

  // Auto-expand all entry type folders (or all filtered results when searching)
  useEffect(() => {
    if (searchQuery) {
      // When searching, expand all branches in filtered results
      const filtered = treeCollection.filter((node) =>
        contains(node.name, searchQuery)
      )
      const branchValues = filtered.getBranchValues()

      // Only update if the values are different
      setExpandedNodes((prev) => {
        const prevSet = new Set(prev)
        const newSet = new Set(branchValues)
        if (
          prevSet.size !== newSet.size ||
          !branchValues.every((val) => prevSet.has(val))
        ) {
          return branchValues
        }
        return prev
      })
    } else {
      // When not searching, expand all entry type folders
      const collectEntryTypeFolderIds = (nodes: TreeNode[]): string[] => {
        const ids: string[] = []
        for (const node of nodes) {
          if (node.isEntryTypeFolder) {
            ids.push(node.id)
            if (node.children) {
              ids.push(...collectEntryTypeFolderIds(node.children))
            }
          }
        }
        return ids
      }

      const rootNode = treeCollection.rootNode
      const entryTypeFolderIds = rootNode.children
        ? collectEntryTypeFolderIds(rootNode.children)
        : []

      // Only update if the values are different
      setExpandedNodes((prev) => {
        const prevSet = new Set(prev)
        const newSet = new Set(entryTypeFolderIds)
        if (
          prevSet.size !== newSet.size ||
          !entryTypeFolderIds.every((val) => prevSet.has(val))
        ) {
          return entryTypeFolderIds
        }
        return prev
      })
    }
  }, [treeCollection, searchQuery])

  const dockItems: DockItemData[] = [
    {
      icon: <FiHome size={20} />,
      label: "Dashboard",
      onClick: () => setCurrentView("dashboard"),
    },
    {
      icon: <FiShare2 size={20} />,
      label: "Tree",
      onClick: () => setCurrentView("tree"),
    },
    {
      icon: <FiCalendar size={20} />,
      label: "Timeline",
      onClick: () => setCurrentView("timeline"),
    },
    {
      icon: <FiSearch size={20} />,
      label: "Search",
      onClick: () => setCurrentView("search"),
    },
    {
      icon: <LuNetwork size={20} />,
      label: "Knowledge Graph",
      onClick: () => setCurrentView("knowledge-graph"),
    },
    {
      icon: <FiPlus size={20} />,
      label: "Create",
      onClick: () => {
        router.push(`/weaves/${weaveId}/worlds/${worldId}/entries/create`)
      },
    },
  ]

  if (worldLoading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.300">Loading...</Text>
      </Container>
    )
  }

  if (!world) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.300">World not found</Text>
      </Container>
    )
  }

  return (
    <>
      <style jsx global>{`
        body {
          overflow: hidden !important;
        }
      `}</style>
      <Flex
        direction="column"
        height="100vh"
        maxW="container.xl"
        mx="auto"
        overflow="hidden"
      >
        {/* World Header */}
        <Box mx="auto" maxW="90%" pt={8} flexShrink={0}>
          <Flex align="start" gap={4} mb={8}>
            {world.icon && (
              <Text fontSize="5xl" lineHeight={1}>
                {world.icon}
              </Text>
            )}
            <Box flex={1}>
              <Heading size="2xl" mb={2} color="white">
                {world.name}
              </Heading>
            </Box>
          </Flex>
        </Box>

        {/* Content Area - Scrollable */}
        <Box flex={1} overflow="hidden" pb="100px">
          {/* Dashboard View */}
          {currentView === "dashboard" && (
            <DashboardView
              isLoading={entriesLoading}
              entries={entries}
              weaveId={weaveId}
              worldId={worldId}
            />
          )}

          {/* Tree View */}
          {currentView === "tree" && (
            <WorldTreeView
              isLoading={allEntriesLoading}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedTags={selectedTags}
              onSelectedTagsChange={setSelectedTags}
              tagSearchValue={tagSearchValue}
              onTagSearchValueChange={setTagSearchValue}
              filteredTags={filteredTags}
              tagCollection={tagCollection}
              filteredTreeCollection={filteredTreeCollection}
              expandedNodes={expandedNodes}
              onExpandedNodesChange={setExpandedNodes}
              weaveId={weaveId}
              worldId={worldId}
              onDeleteEntry={handleDeleteEntry}
              onRenameEntryType={handleRenameEntryType}
              onCreateNestedEntryType={handleCreateNestedEntryType}
              onDeleteEntryType={handleDeleteEntryType}
              numberOfEntries={allEntries.length}
              numberOfEntryTypes={entryTypes.length}
            />
          )}

          {/* Timeline View */}
          {currentView === "timeline" && <TimelineView />}

          {/* Search View */}
          {currentView === "search" && <SearchView />}

          {/* Knowledge Graph View */}
          {currentView === "knowledge-graph" && <KnowledgeGraphView />}
        </Box>
      </Flex>

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

      {/* Delete Confirmation Dialog */}
      <DeleteEntryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entryName={entryToDelete?.name || null}
        onConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Rename Entry Type Dialog */}
      <RenameEntryTypeDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        entryTypeName={entryTypeToRename?.name || null}
        newName={newEntryTypeName}
        onNewNameChange={setNewEntryTypeName}
        onConfirm={confirmRename}
        isLoading={renameMutation.isPending}
      />

      {/* Create Nested Entry Type Dialog */}
      <CreateNestedEntryTypeDialog
        open={createNestedDialogOpen}
        onOpenChange={setCreateNestedDialogOpen}
        parentEntryTypeName={parentEntryType?.name || null}
        newName={nestedEntryTypeName}
        onNewNameChange={setNestedEntryTypeName}
        onConfirm={confirmCreateNested}
        isLoading={createNestedMutation.isPending}
      />

      {/* Delete Entry Type Dialog */}
      <DeleteEntryTypeDialog
        open={deleteEntryTypeDialogOpen}
        onOpenChange={setDeleteEntryTypeDialogOpen}
        entryTypeName={entryTypeToDelete?.name || null}
        onConfirm={confirmDeleteEntryType}
        isLoading={deleteEntryTypeMutation.isPending}
        hasEntries={
          entryTypeToDelete ? entryTypeHasEntries(entryTypeToDelete.id) : false
        }
      />
    </>
  )
}
