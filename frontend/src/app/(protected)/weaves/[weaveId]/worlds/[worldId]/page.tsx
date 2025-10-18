"use client"

import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  TreeView,
  createTreeCollection,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import {
  FiPlus,
  FiCalendar,
  FiFilter,
  FiHome,
  FiSearch,
  FiShare2,
  FiFile,
} from "react-icons/fi"
import { LuNetwork, LuFolder, LuFile as LuFileIcon } from "react-icons/lu"

import {
  Weaves as WeavesAPI,
  Worlds as WorldsAPI,
  Entries as EntriesAPI,
  EntryTypes as EntryTypesAPI,
} from "@/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Dock, { DockItemData } from "@/components/Dock"
import Masonry from "@/components/Masonry"

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
  const [treeViewMode, setTreeViewMode] = useState<"hierarchy" | "entry-type">(
    "hierarchy"
  )

  const { data: world, isLoading: worldLoading } = useQuery({
    queryFn: () => WorldsAPI.getWorld({ weaveId, worldId }),
    queryKey: ["world", weaveId, worldId],
  })

  const { data: entryTypesData } = useQuery({
    queryFn: () => EntryTypesAPI.listEntryTypes({ weaveId, worldId }),
    queryKey: ["entryTypes", weaveId, worldId],
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
  interface TreeNode {
    id: string
    name: string
    icon?: string | null
    entryTypeName?: string | null
    children?: TreeNode[]
    childrenCount?: number
    isEntryTypeFolder?: boolean
  }

  const treeCollection = useMemo(() => {
    if (allEntries.length === 0) {
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

    if (treeViewMode === "entry-type") {
      // Build hierarchical tree based on entry types using iterative approach
      const entryTypes = entryTypesData?.data || []

      // Group entries by entry type ID
      const entriesByType = new Map<string, typeof allEntries>()
      allEntries.forEach((entry) => {
        const typeId = entry.entry_type_id
        if (!entriesByType.has(typeId)) {
          entriesByType.set(typeId, [])
        }
        entriesByType.get(typeId)!.push(entry)
      })

      // Create a map of entry type nodes
      const typeNodesMap = new Map<string, TreeNode>()

      // Create nodes for all entry types that have entries
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

        // Create the type node (even if it has no entries yet, it might have children)
        typeNodesMap.set(type.id, {
          id: `type-${type.id}`,
          name: type.name,
          icon: null,
          entryTypeName: null,
          children: entryNodes,
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

      // Helper function to recursively filter out empty entry type nodes
      const filterEmptyEntryTypes = (node: TreeNode): TreeNode | null => {
        if (!node.children || node.children.length === 0) {
          // Node has no children at all
          return null
        }

        // Process all children recursively
        const filteredChildren: TreeNode[] = []

        for (const child of node.children) {
          if (child.isEntryTypeFolder) {
            // This is an entry type folder - recursively filter it
            const filteredChild = filterEmptyEntryTypes(child)
            if (filteredChild) {
              filteredChildren.push(filteredChild)
            }
          } else {
            // This is an actual entry - keep it
            filteredChildren.push(child)
          }
        }

        // If no children remain after filtering, return null
        if (filteredChildren.length === 0) {
          return null
        }

        // Return the node with filtered children
        return {
          ...node,
          children: filteredChildren,
          childrenCount: filteredChildren.length,
        }
      }

      // Second pass: Build root nodes and filter out empty entry types
      typeNodesMap.forEach((node, typeId) => {
        const typedNode = node as TreeNode & { _parentId: string | null }
        const parentId = typedNode._parentId

        // Only process root-level types or types whose parent wasn't found
        if (parentId === null || !typeNodesMap.has(parentId)) {
          // Filter this node and its descendants
          const filteredNode = filterEmptyEntryTypes(typedNode)
          if (filteredNode) {
            delete (filteredNode as any)._parentId
            rootNodes.push(filteredNode)
          }
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
    }

    // Default: hierarchical view by parent-child relationships
    // Build a map of entries by id
    const entryMap = new Map(allEntries.map((entry) => [entry.id, entry]))

    // Build tree structure
    const buildTree = (parentId: string | null = null): TreeNode[] => {
      return allEntries
        .filter((entry) => entry.parent_id === parentId)
        .sort((a, b) => a.position - b.position)
        .map((entry) => ({
          id: entry.id,
          name: entry.title,
          icon: entry.icon,
          entryTypeName: entry.entry_type_name,
          childrenCount: entry.children_count ?? 0,
          children: entry.children_count ? buildTree(entry.id) : undefined,
          isEntryTypeFolder: false,
        }))
    }

    const rootNodes = buildTree(null)

    return createTreeCollection<TreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: {
        id: "ROOT",
        name: "",
        children: rootNodes,
      },
    })
  }, [allEntries, treeViewMode, entryTypesData])

  // Note: Auto-expand removed to prevent infinite render loops
  // Users can manually expand/collapse nodes as needed

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
      <Container maxW="container.xl" py={8} pb={32}>
        {/* World Header */}
        <Box mx="auto" maxW="90%">
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
              {world.description && (
                <Text fontSize="lg" color="gray.100">
                  {world.description}
                </Text>
              )}
            </Box>
          </Flex>
        </Box>

        {/* Dashboard View */}
        {currentView === "dashboard" && (
          <Box mx="auto" maxW="90%">
            {entriesLoading ? (
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
              <Box minH="600px">
                <Masonry items={masonryItems} />
              </Box>
            )}
          </Box>
        )}

        {/* Tree View */}
        {currentView === "tree" && (
          <Box mx="auto" maxW="90%">
            {allEntriesLoading ? (
              <Text color="gray.300">Loading entries...</Text>
            ) : allEntries.length === 0 ? (
              <Box textAlign="center" py={16}>
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
              <>
                {/* Tree View Mode Selector */}
                <Flex gap={2} mb={4} justify="start">
                  <Button
                    size="sm"
                    variant={treeViewMode === "hierarchy" ? "solid" : "ghost"}
                    colorPalette={
                      treeViewMode === "hierarchy" ? "teal" : "gray"
                    }
                    onClick={() => setTreeViewMode("hierarchy")}
                  >
                    Hierarchy
                  </Button>
                  <Button
                    size="sm"
                    variant={treeViewMode === "entry-type" ? "solid" : "ghost"}
                    colorPalette={
                      treeViewMode === "entry-type" ? "teal" : "gray"
                    }
                    onClick={() => setTreeViewMode("entry-type")}
                  >
                    By Entry Type
                  </Button>
                </Flex>

                <TreeView.Root collection={treeCollection} size="md">
                  <TreeView.Tree>
                    <TreeView.Node<TreeNode>
                      indentGuide={<TreeView.BranchIndentGuide />}
                      render={({ node, nodeState }) => {
                        // In entry-type mode, folder nodes are entry types (not clickable entries)
                        const isEntryTypeFolder =
                          node.isEntryTypeFolder === true

                        return nodeState.isBranch ? (
                          isEntryTypeFolder ? (
                            <TreeView.BranchControl
                              _hover={{ bg: "rgba(20, 184, 166, 0.1)" }}
                              transition="background 0.2s"
                              bg="rgba(20, 184, 166, 0.05)"
                              borderRadius="md"
                            >
                              <LuFolder color="rgb(20, 184, 166)" />
                              <TreeView.BranchText
                                color="rgb(94, 234, 212)"
                                fontWeight="medium"
                              >
                                {node.name}
                              </TreeView.BranchText>
                              <TreeView.BranchIndicator color="rgb(94, 234, 212)" />
                            </TreeView.BranchControl>
                          ) : (
                            <Link
                              href={`/weaves/${weaveId}/worlds/${worldId}/entries/${node.id}`}
                              style={{
                                textDecoration: "none",
                                display: "block",
                              }}
                            >
                              <TreeView.BranchControl
                                _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                                transition="background 0.2s"
                              >
                                {node.icon ? (
                                  <Text fontSize="md">{node.icon}</Text>
                                ) : (
                                  <LuFolder color="white" />
                                )}
                                <TreeView.BranchText color="white">
                                  {node.name}
                                </TreeView.BranchText>
                                {node.entryTypeName && (
                                  <Badge
                                    size="sm"
                                    ml={2}
                                    bg="rgba(255, 255, 255, 0.1)"
                                    color="gray.300"
                                  >
                                    {node.entryTypeName}
                                  </Badge>
                                )}
                                <TreeView.BranchIndicator />
                              </TreeView.BranchControl>
                            </Link>
                          )
                        ) : (
                          <Link
                            href={`/weaves/${weaveId}/worlds/${worldId}/entries/${node.id}`}
                            style={{ textDecoration: "none", display: "block" }}
                          >
                            <TreeView.Item
                              _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                              transition="background 0.2s"
                            >
                              {node.icon ? (
                                <Text fontSize="md">{node.icon}</Text>
                              ) : (
                                <LuFileIcon color="white" />
                              )}
                              <TreeView.ItemText color="white">
                                {node.name}
                              </TreeView.ItemText>
                              {node.entryTypeName && (
                                <Badge
                                  size="sm"
                                  ml={2}
                                  bg="rgba(255, 255, 255, 0.1)"
                                  color="gray.300"
                                >
                                  {node.entryTypeName}
                                </Badge>
                              )}
                            </TreeView.Item>
                          </Link>
                        )
                      }}
                    />
                  </TreeView.Tree>
                </TreeView.Root>
              </>
            )}
          </Box>
        )}

        {/* Timeline View */}
        {currentView === "timeline" && (
          <Box mx="auto" maxW="90%" textAlign="center" py={16}>
            <Heading size="lg" mb={4} color="white">
              Timeline
            </Heading>
            <Text color="gray.300">Coming soon...</Text>
          </Box>
        )}

        {/* Search View */}
        {currentView === "search" && (
          <Box mx="auto" maxW="90%" textAlign="center" py={16}>
            <Heading size="lg" mb={4} color="white">
              Search
            </Heading>
            <Text color="gray.300">Coming soon...</Text>
          </Box>
        )}

        {/* Knowledge Graph View */}
        {currentView === "knowledge-graph" && (
          <Box mx="auto" maxW="90%" textAlign="center" py={16}>
            <Heading size="lg" mb={4} color="white">
              Knowledge Graph
            </Heading>
            <Text color="gray.300">Coming soon...</Text>
          </Box>
        )}
      </Container>

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
