"use client"

import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"

import { Users } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import PendingUsers from "@/components/Pending/PendingUsers"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@chakra-ui/react"

const PER_PAGE = 5

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      Users.readUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["users", { page }],
  }
}

export default function Admin() {
  const [page, setPage] = useState(1)

  const { data, isLoading, isPlaceholderData } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const users = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  if (isLoading) {
    return <PendingUsers />
  }

  if (users.length === 0) {
    return (
      <Container maxW="full">
        <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
          User Management
        </Heading>

        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>👥</EmptyState.Indicator>
            <EmptyState.Title>No users yet</EmptyState.Title>
            <EmptyState.Description>
              Get started by creating your first user.
            </EmptyState.Description>
          </EmptyState.Content>
          <AddUser />
        </EmptyState.Root>
      </Container>
    )
  }

  return (
    <Container maxW="full">
      <Heading size="lg" textAlign={{ base: "center", md: "left" }} pt={12}>
        User Management
      </Heading>

      <Flex py={8} gap={4} direction={{ base: "column", md: "row" }}>
        <AddUser />
      </Flex>

      <Box>
        {users.map((user) => (
          <Box
            key={user.id}
            p={4}
            borderWidth={1}
            borderRadius="md"
            mb={4}
            _hover={{ bg: "gray.50" }}
          >
            <Flex justify="space-between" align="center">
              <Box>
                <Heading size="sm">{user.full_name || "No Name"}</Heading>
                <Text color="gray.600">{user.email}</Text>
                <Text fontSize="sm" color="gray.500">
                  {user.is_superuser ? "Admin" : "User"} •{" "}
                  {user.is_active ? "Active" : "Inactive"}
                </Text>
              </Box>
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
