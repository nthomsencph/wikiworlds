"use client"

import { useState } from "react"
import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { FiAlertTriangle } from "react-icons/fi"

import { Weaves as WeavesAPI } from "@/client"
import { Button } from "@/components/ui/button"
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogActionTrigger,
  DialogCloseTrigger,
} from "@/components/ui/dialog"
import { toaster } from "@/components/ui/toaster"

interface DeleteWeaveModalProps {
  isOpen: boolean
  onClose: () => void
  weaveId: string
}

export default function DeleteWeaveModal({
  isOpen,
  onClose,
  weaveId,
}: DeleteWeaveModalProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch all user's weaves to check if this is the only one
  const { data: weavesData } = useQuery({
    queryFn: () => WeavesAPI.listMyWeaves({ skip: 0, limit: 100 }),
    queryKey: ["weaves"],
  })

  const weaves = weavesData?.data ?? []
  const isOnlyWeave = weaves.length === 1

  // Get the current weave name for display
  const currentWeave = weaves.find((w) => w.id === weaveId)

  const deleteMutation = useMutation({
    mutationFn: () => WeavesAPI.deleteWeave({ weaveId }),
    onSuccess: () => {
      toaster.create({
        title: "Weave deleted",
        description: "Your weave has been successfully deleted.",
        type: "success",
      })

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["weaves"] })
      queryClient.invalidateQueries({ queryKey: ["weave", weaveId] })

      // Redirect to weaves list page (which will auto-redirect to first weave)
      router.push("/weaves")
      onClose()
    },
    onError: (error: any) => {
      toaster.create({
        title: "Failed to delete weave",
        description:
          error.message || "An error occurred while deleting the weave.",
        type: "error",
      })
      setIsDeleting(false)
    },
  })

  const handleDelete = async () => {
    if (isOnlyWeave) return
    setIsDeleting(true)
    deleteMutation.mutate()
  }

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={(e) => !isDeleting && !e.open && onClose()}
      size="md"
    >
      <DialogContent
        bg="rgba(0, 0, 0, 0.98)"
        borderColor="red.800"
        borderWidth={1}
        backdropFilter="blur(30px)"
        borderRadius="3xl"
      >
        <DialogHeader>
          <DialogTitle color="white">
            <Flex align="center" gap={2}>
              <FiAlertTriangle color="#F56565" />
              Delete {currentWeave?.name}
            </Flex>
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          {isOnlyWeave ? (
            <Box>
              <Text color="gray.300" mb={4}>
                A creator must have at least one weave. Since this is your only
                one, you can&apos;t delete it. Create a new weave before
                deleting this one, or keep using {currentWeave?.name}.
              </Text>
            </Box>
          ) : (
            <Box>
              <Text color="gray.300" mb={4}>
                Are you sure you want to delete{" "}
                <Text as="span" fontWeight="bold" color="white">
                  {currentWeave?.name}
                </Text>
                ?
              </Text>
              <Text color="gray.400" fontSize="sm" mb={2}>
                This action will:
              </Text>
              <Box
                as="ul"
                color="gray.400"
                fontSize="sm"
                pl={5}
                css={{ listStyleType: "disc" }}
              >
                <li>Permanently delete the weave</li>
                <li>Delete all worlds within this weave</li>
                <li>Delete all entries within those worlds</li>
              </Box>
              <Box
                mt={4}
                p={3}
                borderRadius="md"
                bg="rgba(139, 0, 0, 0.2)"
                borderWidth={1}
                borderColor="red.800"
              >
                <Text color="red.400" fontSize="sm" fontWeight="medium">
                  This action cannot be undone.
                </Text>
              </Box>
            </Box>
          )}
        </DialogBody>

        <DialogFooter>
          {isOnlyWeave ? (
            <DialogActionTrigger asChild>
              <Button
                variant="outline"
                onClick={onClose}
                size="sm"
                borderRadius="full"
                colorPalette="gray"
              >
                Close
              </Button>
            </DialogActionTrigger>
          ) : (
            <>
              <DialogActionTrigger asChild>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isDeleting}
                  size="sm"
                  borderRadius="full"
                >
                  Cancel
                </Button>
              </DialogActionTrigger>
              <Button
                colorPalette="red"
                onClick={handleDelete}
                loading={isDeleting}
                size="sm"
                borderRadius="full"
              >
                Delete Weave
              </Button>
            </>
          )}
        </DialogFooter>

        <DialogCloseTrigger disabled={isDeleting} />
      </DialogContent>
    </DialogRoot>
  )
}
