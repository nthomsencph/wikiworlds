"use client"

import { Heading, Text } from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteEntryTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryTypeName: string | null
  onConfirm: () => void
  isLoading: boolean
  hasEntries: boolean
}

export const DeleteEntryTypeDialog = ({
  open,
  onOpenChange,
  entryTypeName,
  onConfirm,
  isLoading,
  hasEntries,
}: DeleteEntryTypeDialogProps) => {
  return (
    <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <DialogContent>
        <DialogHeader>
          <Heading size="md">Delete Entry Type</Heading>
        </DialogHeader>
        <DialogBody>
          {hasEntries ? (
            <Text color="red.400">
              Cannot delete <strong>&quot;{entryTypeName}&quot;</strong> because
              it contains entries or has child entry types with entries. Please
              delete or move all entries first.
            </Text>
          ) : (
            <Text>
              Are you sure you want to delete the entry type{" "}
              <strong>&quot;{entryTypeName}&quot;</strong>? This action cannot
              be undone.
            </Text>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          {!hasEntries && (
            <Button colorPalette="red" onClick={onConfirm} loading={isLoading}>
              Delete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export type { DeleteEntryTypeDialogProps }
