"use client"

import { HStack, IconButton } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { LuExternalLink, LuArrowRightLeft, LuTrash } from "react-icons/lu"
import type { TreeNode } from "./types"

interface TreeNodeActionsProps {
  node: TreeNode
  weaveId: string
  worldId: string
  onDelete: (entryId: string, entryName: string) => void
}

export const TreeNodeActions = ({
  node,
  weaveId,
  worldId,
  onDelete,
}: TreeNodeActionsProps) => {
  const router = useRouter()

  // Don't show actions for entry type folders
  if (node.isEntryTypeFolder) {
    return null
  }

  return (
    <HStack
      gap="0.5"
      position="absolute"
      right="2"
      top="50%"
      transform="translateY(-50%)"
      opacity={0}
      className="tree-node-actions"
    >
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Open entry"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          router.push(`/weaves/${weaveId}/worlds/${worldId}/entries/${node.id}`)
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuExternalLink />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Move entry"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          // TODO: Implement move functionality
          alert("Move functionality coming soon!")
        }}
        color="white"
        _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
      >
        <LuArrowRightLeft />
      </IconButton>
      <IconButton
        size="xs"
        variant="ghost"
        aria-label="Delete entry"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onDelete(node.id, node.name)
        }}
        color="red.400"
        _hover={{ bg: "rgba(255, 0, 0, 0.1)" }}
      >
        <LuTrash />
      </IconButton>
    </HStack>
  )
}

export type { TreeNodeActionsProps }
