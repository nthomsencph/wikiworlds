"use client"

import {
  Box,
  Text,
  Flex,
  Input,
  Combobox,
  Portal,
  TreeView,
  Highlight,
  Badge,
  Tag,
} from "@chakra-ui/react"
import Link from "next/link"
import { LuFolder, LuFile as LuFileIcon } from "react-icons/lu"
import { TreeNodeActions } from "./TreeNodeActions"
import { EntryTypeActions } from "./EntryTypeActions"
import type { TreeNode } from "./types"
import type { TreeCollection } from "@chakra-ui/react"

interface WorldTreeViewProps {
  isLoading: boolean
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  selectedTags: string[]
  onSelectedTagsChange: (tags: string[]) => void
  tagSearchValue: string
  onTagSearchValueChange: (value: string) => void
  filteredTags: string[]
  tagCollection: any
  filteredTreeCollection: TreeCollection<TreeNode>
  expandedNodes: string[]
  onExpandedNodesChange: (nodes: string[]) => void
  weaveId: string
  worldId: string
  onDeleteEntry: (entryId: string, entryName: string) => void
  onRenameEntryType: (entryTypeId: string, entryTypeName: string) => void
  onCreateNestedEntryType: (entryTypeId: string, entryTypeName: string) => void
  onDeleteEntryType: (entryTypeId: string, entryTypeName: string) => void
  numberOfEntries: number
  numberOfEntryTypes: number
}

export const WorldTreeView = ({
  isLoading,
  searchQuery,
  onSearchQueryChange,
  selectedTags,
  onSelectedTagsChange,
  tagSearchValue,
  onTagSearchValueChange,
  filteredTags,
  tagCollection,
  filteredTreeCollection,
  expandedNodes,
  onExpandedNodesChange,
  weaveId,
  worldId,
  onDeleteEntry,
  onRenameEntryType,
  onCreateNestedEntryType,
  onDeleteEntryType,
  numberOfEntries,
  numberOfEntryTypes,
}: WorldTreeViewProps) => {
  return (
    <Box height="100%" mx="auto" maxW="90%">
      {isLoading ? (
        <Text color="gray.300">Loading entries...</Text>
      ) : (
        <Flex direction="column" height="100%">
          {/* Search and Filter Row - Fixed */}
          <Flex gap={3} mb={4} flexShrink={0}>
            {/* Search Input - 66% width */}
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={`Search ${numberOfEntries} entries in ${numberOfEntryTypes} entry types...`}
              size="md"
              flex="2"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="lg"
              color="white"
              _placeholder={{ color: "rgba(255, 255, 255, 0.3)" }}
              _focus={{
                outline: "none",
                borderColor: "rgba(20, 184, 166, 0.5)",
                boxShadow: "0 0 0 1px rgba(20, 184, 166, 0.5)",
              }}
            />

            {/* Tag Filter - 33% width */}
            {/* NOTE: This custom implementation will be replaceable with native TagsInput component in Chakra UI v3.28.0 */}
            <Box flex="1">
              <Combobox.Root
                multiple
                value={selectedTags}
                collection={tagCollection}
                onValueChange={(details) => onSelectedTagsChange(details.value)}
                onInputValueChange={(details) =>
                  onTagSearchValueChange(details.inputValue)
                }
              >
                <Combobox.Control>
                  <Flex
                    wrap="nowrap"
                    gap={1.5}
                    px={2}
                    py={0}
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="lg"
                    height="40px"
                    alignItems="center"
                    _focusWithin={{
                      borderColor: "rgba(20, 184, 166, 0.5)",
                      boxShadow: "0 0 0 1px rgba(20, 184, 166, 0.5)",
                    }}
                  >
                    {selectedTags.map((tag) => (
                      <Tag.Root
                        key={tag}
                        size="sm"
                        colorPalette="teal"
                        variant="solid"
                        py={0.5}
                        px={2}
                        height="24px"
                      >
                        <Tag.Label fontSize="xs">{tag}</Tag.Label>
                        <Tag.EndElement>
                          <Tag.CloseTrigger
                            onClick={() =>
                              onSelectedTagsChange(
                                selectedTags.filter((t) => t !== tag)
                              )
                            }
                          />
                        </Tag.EndElement>
                      </Tag.Root>
                    ))}
                    <Combobox.Input
                      placeholder={
                        selectedTags.length === 0
                          ? "Filter tags..."
                          : "Add more..."
                      }
                      bg="transparent"
                      border="none"
                      color="white"
                      flex="1"
                      minW="120px"
                      _placeholder={{ color: "rgba(255, 255, 255, 0.3)" }}
                      _focus={{
                        outline: "none",
                        border: "none",
                        boxShadow: "none",
                      }}
                    />
                    <Combobox.IndicatorGroup>
                      <Combobox.Trigger />
                    </Combobox.IndicatorGroup>
                  </Flex>
                </Combobox.Control>

                <Portal>
                  <Combobox.Positioner>
                    <Combobox.Content
                      bg="rgba(20, 20, 20, 0.95)"
                      backdropFilter="blur(10px)"
                      borderRadius="xl"
                      boxShadow="0 4px 12px rgba(0, 0, 0, 0.5)"
                      border="1px solid rgba(255, 255, 255, 0.1)"
                    >
                      <Combobox.ItemGroup>
                        {filteredTags.map((tag) => (
                          <Combobox.Item
                            key={tag}
                            item={tag}
                            _hover={{ bg: "rgba(20, 184, 166, 0.1)" }}
                            color="white"
                          >
                            {tag}
                            <Combobox.ItemIndicator color="rgb(94, 234, 212)" />
                          </Combobox.Item>
                        ))}
                        <Combobox.Empty color="gray.400" px={3} py={2}>
                          No tags found
                        </Combobox.Empty>
                      </Combobox.ItemGroup>
                    </Combobox.Content>
                  </Combobox.Positioner>
                </Portal>
              </Combobox.Root>
            </Box>
          </Flex>

          {/* Scrollable Tree Container */}
          <Box flex={1} overflowY="auto" overflowX="hidden">
            <TreeView.Root
              collection={filteredTreeCollection}
              size="md"
              expandedValue={expandedNodes}
              onExpandedChange={(e) => onExpandedNodesChange(e.expandedValue)}
              animateContent
            >
              <TreeView.Tree>
                <TreeView.Node<TreeNode>
                  indentGuide={<TreeView.BranchIndentGuide />}
                  render={({ node, nodeState }) => {
                    // Folder nodes are entry types (not clickable entries)
                    const isEntryTypeFolder = node.isEntryTypeFolder === true

                    return nodeState.isBranch ? (
                      isEntryTypeFolder ? (
                        <Box
                          position="relative"
                          _hover={{ "& .entry-type-actions": { opacity: 1 } }}
                        >
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
                              <Highlight
                                query={searchQuery ? [searchQuery] : []}
                                styles={{ bg: "rgba(255, 255, 255, 0.3)" }}
                              >
                                {node.name}
                              </Highlight>
                            </TreeView.BranchText>
                            <TreeView.BranchIndicator color="rgb(94, 234, 212)" />
                          </TreeView.BranchControl>
                          <EntryTypeActions
                            node={node}
                            weaveId={weaveId}
                            worldId={worldId}
                            onRename={onRenameEntryType}
                            onCreateNested={onCreateNestedEntryType}
                            onDelete={onDeleteEntryType}
                          />
                        </Box>
                      ) : (
                        <Box
                          position="relative"
                          _hover={{ "& .tree-node-actions": { opacity: 1 } }}
                        >
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
                                <Highlight
                                  query={searchQuery ? [searchQuery] : []}
                                  styles={{ bg: "rgba(255, 255, 255, 0.3)" }}
                                >
                                  {node.name}
                                </Highlight>
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
                          <TreeNodeActions
                            node={node}
                            weaveId={weaveId}
                            worldId={worldId}
                            onDelete={onDeleteEntry}
                          />
                        </Box>
                      )
                    ) : (
                      <Box
                        position="relative"
                        _hover={{ "& .tree-node-actions": { opacity: 1 } }}
                      >
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
                              <Highlight
                                query={searchQuery ? [searchQuery] : []}
                                styles={{ bg: "rgba(255, 255, 255, 0.3)" }}
                              >
                                {node.name}
                              </Highlight>
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
                        <TreeNodeActions
                          node={node}
                          weaveId={weaveId}
                          worldId={worldId}
                          onDelete={onDeleteEntry}
                        />
                      </Box>
                    )
                  }}
                />
              </TreeView.Tree>
            </TreeView.Root>
          </Box>
        </Flex>
      )}
    </Box>
  )
}

export type { WorldTreeViewProps }
