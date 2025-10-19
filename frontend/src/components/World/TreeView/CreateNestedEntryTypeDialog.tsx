"use client"

import { Heading, Text, Input } from "@chakra-ui/react"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CreateNestedEntryTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parentEntryTypeName: string | null
  newName: string
  onNewNameChange: (name: string) => void
  onConfirm: () => void
  isLoading: boolean
}

export const CreateNestedEntryTypeDialog = ({
  open,
  onOpenChange,
  parentEntryTypeName,
  newName,
  onNewNameChange,
  onConfirm,
  isLoading,
}: CreateNestedEntryTypeDialogProps) => {
  return (
    <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <DialogContent>
        <DialogHeader>
          <Heading size="md">Create Nested Entry Type</Heading>
        </DialogHeader>
        <DialogBody>
          <Text mb={3}>
            Create a nested entry type under{" "}
            <strong>&quot;{parentEntryTypeName}&quot;</strong>
          </Text>
          <Input
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
            placeholder="Entry type name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                onConfirm()
              }
            }}
          />
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="outline">Cancel</Button>
          </DialogActionTrigger>
          <Button
            colorPalette="teal"
            onClick={onConfirm}
            loading={isLoading}
            disabled={!newName.trim()}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  )
}

export type { CreateNestedEntryTypeDialogProps }
