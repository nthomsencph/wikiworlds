"use client"

import { HStack, IconButton } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import {
  LuFolderPlus,
  LuFilePlus,
  LuPencil,
  LuArrowRightLeft,
  LuTrash2,
} from "react-icons/lu"
import type { TreeNode } from "./types"

interface EntryTypeActionsProps {
  node: TreeNode
  weaveId: string
  worldId: string
  onRename: (entryTypeId: string, entryTypeName: string) => void
  onCreateNested: (entryTypeId: string, entryTypeName: string) => void
  onDelete: (entryTypeId: string, entryTypeName: string) => void
}

export const EntryTypeActions = ({
  node,
  weaveId,
  worldId,
  onRename,
  onCreateNested,
  onDelete,
}: EntryTypeActionsProps) => {
  const router = useRouter()

  // Only show actions for entry type folders
  if (!node.isEntryTypeFolder) {
    return null
  }

  // Extract the actual entry type ID from the node ID (format: type-UUID)
  const entryTypeId = node.id.replace("type-", "")

  return (
    <HStack
      gap="0.5"
      position="absolute"
      right="2"
      top="50%"
      transform="translateY(-50%)"
      opacity={0}
      className="entry-type-actions"
    >
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Create nested entry type"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onCreateNested(entryTypeId, node.name)
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuFolderPlus />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Create new entry"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          router.push(
            `/weaves/${weaveId}/worlds/${worldId}/entries/create?entryTypeId=${entryTypeId}`
          )
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuFilePlus />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Rename entry type"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onRename(entryTypeId, node.name)
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuPencil />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Move entry type"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          // TODO: Implement move functionality
          alert("Move entry type functionality coming soon!")
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuArrowRightLeft />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Delete entry type"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onDelete(entryTypeId, node.name)
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuTrash2 />
      </IconButton>
    </HStack>
  )
}

export type { EntryTypeActionsProps }
