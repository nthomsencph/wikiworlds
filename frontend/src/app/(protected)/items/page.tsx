"use client"

import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { FiPlus } from "react-icons/fi"

import { Items as ItemsAPI } from "@/client"
import AddItem from "@/components/Items/AddItem"
import { ItemActionsMenu } from "@/components/Common/ItemActionsMenu"
import PendingItems from "@/components/Pending/PendingItems"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@chakra-ui/react"

const PER_PAGE = 5

function getItemsQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      ItemsAPI.readItems({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["items", { page }],
  }
}

export default function Items() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getItemsQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const items = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingItems />
  }

  if (items.length === 0) {
    return (
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          Items Management
        </Heading>

        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>📋</EmptyState.Indicator>
            <EmptyState.Title>No items yet</EmptyState.Title>
            <EmptyState.Description>
              Get started by creating your first item.
            </EmptyState.Description>
          </EmptyState.Content>
          <AddItem />
        </EmptyState.Root>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        Items Management
      </Heading>

      <Flex py={8} gap={4} direction={{ base: "column", md: "row" }}>
        <AddItem />
      </Flex>

      <Box>
        {items.map((item) => (
          <Box
            key={item.id}
            p={4}
            borderWidth={1}
            borderRadius="md"
            mb={4}
            _hover={{ bg: { base: "gray.50", _dark: "gray.700" } }}
          >
            <Flex justify="space-between" align="start">
              <Box flex={1}>
                <Heading size="sm">{item.title}</Heading>
                {item.description && (
                  <Text color="gray.600" mt={2}>
                    {item.description}
                  </Text>
                )}
              </Box>
              <ItemActionsMenu item={item} />
            </Flex>
          </Box>
        ))}
      </Box>

      {count > PER_PAGE && (
        <Flex justify="center" mt={8}>
          <Button
            variant="outline"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            mr={2}
          >
            Previous
          </Button>
          <Text mx={4} alignSelf="center">
            Page {page} of {Math.ceil(count / PER_PAGE)}
          </Text>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= Math.ceil(count / PER_PAGE)}
            ml={2}
          >
            Next
          </Button>
        </Flex>
      )}
    </Container>
  )
}
