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

interface DeleteEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entryName: string | null
  onConfirm: () => void
  isLoading: boolean
}

export const DeleteEntryDialog = ({
  open,
  onOpenChange,
  entryName,
  onConfirm,
  isLoading,
}: DeleteEntryDialogProps) => {
  return (
    <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <DialogContent>
        <DialogHeader>
          <Heading size="md">Delete Entry</Heading>
        </DialogHeader>
        <DialogBody>
          <Text>
            Are you sure you want to delete{" "}
            <strong>&quot;{entryName}&quot;</strong>? This action cannot be
            undone.
          </Text>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button colorPalette="red" onClick={onConfirm} loading={isLoading}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export type { DeleteEntryDialogProps }
