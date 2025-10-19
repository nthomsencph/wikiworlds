"use client"

import {
  Box,
  Flex,
  Heading,
  Table,
  ActionBar,
  Portal,
  Checkbox,
  Pagination,
  IconButton,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"
import { FiInfo } from "react-icons/fi"

import { Users } from "@/client"
import type { UserPublic } from "@/client"
import AddUser from "@/components/Admin/AddUser"
import { UserActionsMenu } from "@/components/Common/UserActionsMenu"
import PendingUsers from "@/components/Pending/PendingUsers"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@chakra-ui/react"
import { Tooltip } from "@/components/ui/tooltip"

const PER_PAGE = 10

function getUsersQueryOptions({ page }: { page: number }) {
  return {
    queryFn: () =>
      Users.readUsers({ skip: (page - 1) * PER_PAGE, limit: PER_PAGE }),
    queryKey: ["users", { page }],
  }
}

function formatDanishDateTime(date: string | null | undefined): string {
  if (!date) return "Never"

  const formatter = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })

  return formatter.format(new Date(date))
}

export default function Admin() {
  const [page, setPage] = useState(1)
  const [selection, setSelection] = useState<string[]>([])

  const { data, isLoading } = useQuery({
    ...getUsersQueryOptions({ page }),
    placeholderData: (prevData) => prevData,
  })

  const users = data?.data.slice(0, PER_PAGE) ?? []
  const count = data?.count ?? 0

  // Selection state
  const hasSelection = selection.length > 0
  const indeterminate = hasSelection && selection.length < users.length

  if (isLoading) {
    return <PendingUsers />
  }

  if (users.length === 0) {
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="xl" fontWeight="bold" color="white">
            User Management
          </Heading>
        </Flex>

        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>👥</EmptyState.Indicator>
            <EmptyState.Title color="white">No users yet</EmptyState.Title>
            <EmptyState.Description color="gray.400">
              Get started by creating your first user.
            </EmptyState.Description>
          </EmptyState.Content>
          <AddUser />
        </EmptyState.Root>
      </Box>
    )
  }

  const rows = users.map((user: UserPublic) => (
    <Table.Row
      key={user.id}
      data-selected={selection.includes(user.id) ? "" : undefined}
    >
      <Table.Cell>
        <Checkbox.Root
          size="sm"
          top="0.5"
          aria-label="Select row"
          checked={selection.includes(user.id)}
          onCheckedChange={(changes) => {
            setSelection((prev) =>
              changes.checked
                ? [...prev, user.id]
                : prev.filter((id) => id !== user.id)
            )
          }}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      </Table.Cell>
      <Table.Cell color="white">{user.full_name || "No Name"}</Table.Cell>
      <Table.Cell color="white">{user.email}</Table.Cell>
      <Table.Cell color="white">
        {user.is_superuser ? "Admin" : "User"}
      </Table.Cell>
      <Table.Cell color="white">
        {user.is_active ? "Active" : "Inactive"}
      </Table.Cell>
      <Table.Cell color="white">
        {formatDanishDateTime(user.last_active_at)}
      </Table.Cell>
      <Table.Cell color="white" textAlign="center">
        {user.weave_count}
      </Table.Cell>
      <Table.Cell color="white" textAlign="center">
        {user.world_count}
      </Table.Cell>
      <Table.Cell>
        <UserActionsMenu user={user} />
      </Table.Cell>
    </Table.Row>
  ))

  return (
    <>
      <Box>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="xl" fontWeight="bold" color="white">
            User Management
          </Heading>
          <AddUser />
        </Flex>

        <Table.Root size="md" striped stickyHeader interactive variant="line">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader width="50px">
                <Checkbox.Root
                  size="sm"
                  top="0.5"
                  aria-label="Select all rows"
                  checked={
                    indeterminate ? "indeterminate" : selection.length > 0
                  }
                  onCheckedChange={(changes) => {
                    setSelection(
                      changes.checked ? users.map((user) => user.id) : []
                    )
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Table.ColumnHeader>
              <Table.ColumnHeader color="white">Name</Table.ColumnHeader>
              <Table.ColumnHeader color="white">Email</Table.ColumnHeader>
              <Table.ColumnHeader color="white">
                <Flex align="center" gap={1}>
                  Role
                  <Tooltip
                    content={
                      <>
                        Admin: Full system access.
                        <br />
                        User: Standard access.
                      </>
                    }
                  >
                    <Box display="inline-flex" color="gray.400" cursor="help">
                      <FiInfo size={14} />
                    </Box>
                  </Tooltip>
                </Flex>
              </Table.ColumnHeader>
              <Table.ColumnHeader color="white">
                <Flex align="center" gap={1}>
                  Status
                  <Tooltip
                    content={
                      <>
                        <b>Active:</b> Can log in.
                        <br />
                        <b>Inactive:</b> Login disabled.
                      </>
                    }
                  >
                    <Box display="inline-flex" color="gray.400" cursor="help">
                      <FiInfo size={14} />
                    </Box>
                  </Tooltip>
                </Flex>
              </Table.ColumnHeader>
              <Table.ColumnHeader>
                <span style={{ color: "white" }}>
                  Last active{" "}
                  <span style={{ color: "#718096" /* gray.600 */ }}>
                    (CET/CEST)
                  </span>
                </span>
              </Table.ColumnHeader>
              <Table.ColumnHeader color="white" textAlign="center">
                # weaves
              </Table.ColumnHeader>
              <Table.ColumnHeader color="white" textAlign="center">
                # worlds
              </Table.ColumnHeader>
              <Table.ColumnHeader color="white" width="100px">
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>{rows}</Table.Body>
        </Table.Root>

        {count > PER_PAGE && (
          <Flex justify="center" mt={8}>
            <Pagination.Root
              count={count}
              pageSize={PER_PAGE}
              page={page}
              onPageChange={(e) => setPage(e.page)}
            >
              <Pagination.PrevTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <LuChevronLeft />
                </IconButton>
              </Pagination.PrevTrigger>

              <Pagination.Items
                render={(page) => (
                  <IconButton
                    key={page.value}
                    variant={{ base: "ghost", _selected: "outline" }}
                    size="sm"
                  >
                    {page.value}
                  </IconButton>
                )}
              />

              <Pagination.NextTrigger asChild>
                <IconButton variant="ghost" size="sm">
                  <LuChevronRight />
                </IconButton>
              </Pagination.NextTrigger>
            </Pagination.Root>
          </Flex>
        )}
      </Box>

      <ActionBar.Root open={hasSelection}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content>
              <ActionBar.SelectionTrigger>
                {selection.length} selected
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelection([])}
              >
                Clear
              </Button>
              <Button variant="outline" size="sm" colorPalette="red">
                Delete
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </>
  )
}
