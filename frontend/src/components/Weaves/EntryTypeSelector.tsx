'use client'

import {
  Box,
  Flex,
  Text,
  Input,
  Highlight,
  TreeView,
  createTreeCollection,
  useFilter,
  Button as ChakraButton,
  IconButton,
  HStack,
  useTreeViewContext,
} from "@chakra-ui/react"
import { useState, useEffect, useRef, useMemo } from "react"
import { LuFolder, LuChevronDown, LuPlus, LuChevronRight } from "react-icons/lu"
import { FiX } from "react-icons/fi"

import CreateEntryTypeModal from "./CreateEntryTypeModal"

interface EntryType {
  id: string
  name: string
  parent_id?: string | null
}

interface EntryTypeSelectorProps {
  entryTypes: EntryType[]
  selectedEntryType: { id: string; name: string } | null
  onSelect: (type: { id: string; name: string }) => void
  onClear?: () => void
  placeholder?: string
  weaveId: string
  worldId: string
}

interface TreeNode {
  id: string
  name: string
  children?: TreeNode[]
}

interface TreeNodeActionsProps {
  node: TreeNode
  onAdd: (nodeId: string) => void
}

const TreeNodeActions = ({ node, onAdd }: TreeNodeActionsProps) => {
  // All entry types can have children added, so show "+" for all
  return (
    <HStack
      gap="0.5"
      position="absolute"
      right="1"
      top="50%"
      transform="translateY(-50%)"
      css={{
        opacity: 0,
        "[role=treeitem]:hover &, [data-state=open] &": { opacity: 1 },
      }}
    >
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Add entry type"
        onClick={(e) => {
          e.stopPropagation()
          onAdd(node.id)
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.2)" }}
      >
        <LuPlus />
      </IconButton>
    </HStack>
  )
}

export default function EntryTypeSelector({
  entryTypes,
  selectedEntryType,
  onSelect,
  onClear,
  placeholder = "Select entry type...",
  weaveId,
  worldId,
}: EntryTypeSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [query, setQuery] = useState("")
  const [expanded, setExpanded] = useState<string[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [preselectedParentId, setPreselectedParentId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { contains } = useFilter({ sensitivity: "base" })

  // Create tree collection from entry types with hierarchy (memoized)
  const initialCollection = useMemo(() => {
    // Build hierarchical structure from flat list
    const buildTree = (parentId: string | null = null): TreeNode[] => {
      return entryTypes
        .filter(type => type.parent_id === parentId)
        .map(type => {
          const children = buildTree(type.id)
          return {
            id: type.id,
            name: type.name,
            // Only set children if there are actual children for proper TreeView nesting
            children: children.length > 0 ? children : undefined,
          }
        })
    }

    const children = buildTree(null)

    return createTreeCollection<TreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      rootNode: {
        id: "ROOT",
        name: "",
        children,
      },
    })
  }, [entryTypes])

  const [collection, setCollection] = useState(initialCollection)

  // Update collection when initialCollection changes
  useEffect(() => {
    setCollection(initialCollection)
  }, [initialCollection])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setQuery("")
        setCollection(initialCollection)
        setExpanded([])
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [initialCollection])

  const search = (searchQuery: string) => {
    setQuery(searchQuery)
    if (!searchQuery) {
      setCollection(initialCollection)
      setExpanded([])
      return
    }

    const nextCollection = initialCollection.filter((node) =>
      contains(node.name, searchQuery),
    )

    setCollection(nextCollection)
    setExpanded(nextCollection.getBranchValues())
  }

  const handleSelect = (type: { id: string; name: string }) => {
    onSelect(type)
    setShowDropdown(false)
    setQuery("")
    setCollection(initialCollection)
    setExpanded([])
  }

  const handleSelectWithoutClosing = (type: { id: string; name: string }) => {
    onSelect(type)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClear) {
      onClear()
    }
    setQuery("")
    setCollection(initialCollection)
    setExpanded([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setShowDropdown(false)
      setQuery("")
      setCollection(initialCollection)
      setExpanded([])
    }
  }

  const handleAddEntryType = (parentId: string) => {
    setPreselectedParentId(parentId)
    setIsCreateModalOpen(true)
    setShowDropdown(false)
  }

  // Check if we should render as tree or flat list
  const hasHierarchy = useMemo(() => {
    return entryTypes.some(type => type.parent_id !== null)
  }, [entryTypes])

  return (
    <Box position="relative" ref={dropdownRef}>
      {/* Selected Entry Type / Trigger Button */}
      <Flex
        align="center"
        gap={2}
        bg="rgba(54, 54, 54, 0.6)"
        color="white"
        borderRadius="full"
        px={3}
        py={1}
        fontSize="sm"
        cursor="pointer"
        onClick={() => setShowDropdown(!showDropdown)}
        _hover={{ bg: "rgba(70, 70, 70, 0.7)" }}
        transition="background 0.2s"
        minW="150px"
        justify="space-between"
      >
        <Text>
          {selectedEntryType ? selectedEntryType.name : placeholder}
        </Text>
        <Flex align="center" gap={1}>
          {selectedEntryType && onClear && (
            <ChakraButton
              size="xs"
              variant="ghost"
              onClick={handleClear}
              minW="auto"
              h="auto"
              p={1}
              color="gray.400"
              _hover={{ color: "white" }}
            >
              <FiX size={14} />
            </ChakraButton>
          )}
          <LuChevronDown size={16} />
        </Flex>
      </Flex>

      {/* Dropdown */}
      {showDropdown && (
        <Box
          position="absolute"
          top="100%"
          right={0}
          mt={1}
          bg="rgba(20, 20, 20, 0.95)"
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.5)"
          backdropFilter="blur(10px)"
          minW="300px"
          maxH="400px"
          overflowY="auto"
          zIndex={1000}
          border="1px solid rgba(255, 255, 255, 0.1)"
          p={3}
        >
          {/* Search Input */}
          <Input
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search entry types..."
            size="sm"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid rgba(255, 255, 255, 0.1)"
            borderRadius="lg"
            color="white"
            mb={2}
            _placeholder={{ color: "rgba(255, 255, 255, 0.3)" }}
            _focus={{
              outline: "none",
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          />

          {/* Entry Type List - TreeView or Flat */}
          {entryTypes.length > 0 ? (
            hasHierarchy ? (
              // Render as TreeView with hierarchy
              <TreeView.Root
                collection={collection}
                expandedValue={expanded}
                onExpandedChange={(details) => setExpanded(details.expandedValue)}
                size="sm"
              >
                <TreeView.Tree>
                  <TreeView.Node
                    indentGuide={<TreeView.BranchIndentGuide />}
                    render={({ node, nodeState, indexPath }) => {
                      // Skip ROOT node
                      if (node.id === "ROOT") return null

                      // Render branches (with children) with expand/collapse
                      if (nodeState.isBranch) {
                        return (
                          <TreeView.BranchControl
                            _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                            transition="background 0.2s"
                            position="relative"
                            onClick={(e) => {
                              // Only select if not clicking the expand trigger
                              if (!(e.target as HTMLElement).closest('[data-part="branch-trigger"]')) {
                                handleSelectWithoutClosing({ id: node.id, name: node.name })
                              }
                            }}
                            cursor="pointer"
                          >
                            <TreeView.BranchTrigger>
                              <TreeView.BranchIndicator asChild>
                                <LuChevronRight color="white" size={16} />
                              </TreeView.BranchIndicator>
                            </TreeView.BranchTrigger>
                            <LuFolder color="white" size={16} />
                            <TreeView.BranchText color="white" fontSize="sm">
                              <Highlight
                                query={[query]}
                                styles={{ bg: "rgba(255, 255, 255, 0.2)" }}
                              >
                                {node.name}
                              </Highlight>
                            </TreeView.BranchText>
                            <TreeNodeActions
                              node={node}
                              onAdd={handleAddEntryType}
                            />
                          </TreeView.BranchControl>
                        )
                      }

                      // Render leaf nodes as folders too (but without expand trigger)
                      return (
                        <TreeView.Item
                          _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                          transition="background 0.2s"
                          position="relative"
                          onClick={() => handleSelectWithoutClosing({ id: node.id, name: node.name })}
                          cursor="pointer"
                        >
                          <LuFolder color="white" size={16} />
                          <TreeView.ItemText color="white" fontSize="sm">
                            <Highlight
                              query={[query]}
                              styles={{ bg: "rgba(255, 255, 255, 0.2)" }}
                            >
                              {node.name}
                            </Highlight>
                          </TreeView.ItemText>
                          <TreeNodeActions
                            node={node}
                            onAdd={handleAddEntryType}
                          />
                        </TreeView.Item>
                      )
                    }}
                  />
                </TreeView.Tree>
              </TreeView.Root>
            ) : (
              // Render as flat list (fallback for worlds without hierarchy)
              <Box>
                {entryTypes.map((type) => (
                  <Flex
                    key={type.id}
                    align="center"
                    gap={2}
                    px={3}
                    py={2}
                    cursor="pointer"
                    borderRadius="md"
                    _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                    transition="background 0.2s"
                    onClick={() => handleSelect({ id: type.id, name: type.name })}
                  >
                    <LuFolder color="white" size={16} />
                    <Text color="white" fontSize="sm">
                      <Highlight
                        query={[query]}
                        styles={{ bg: "rgba(255, 255, 255, 0.2)" }}
                      >
                        {type.name}
                      </Highlight>
                    </Text>
                  </Flex>
                ))}
              </Box>
            )
          ) : query ? (
            <Box
              py={3}
              px={2}
              textAlign="center"
              color="gray.400"
              fontSize="sm"
            >
              <Text>No entry types found matching &quot;{query}&quot;</Text>
            </Box>
          ) : (
            <Box
              py={3}
              px={2}
              textAlign="center"
              color="gray.400"
              fontSize="sm"
            >
              <Text>No entry types available</Text>
              <Text fontSize="xs" color="gray.500" mt={1}>
                Use the + icon to create entry types
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Create Entry Type Modal */}
      <CreateEntryTypeModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setPreselectedParentId(null)
        }}
        weaveId={weaveId}
        worldId={worldId}
        entryTypes={entryTypes}
        initialParentId={preselectedParentId}
      />
    </Box>
  )
}
