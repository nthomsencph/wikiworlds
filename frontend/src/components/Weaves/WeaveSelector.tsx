"use client"

import { Box, Flex, Text } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { FiCheck, FiChevronDown, FiPlus } from "react-icons/fi"

import { Weaves as WeavesAPI } from "@/client"
import { Button } from "@/components/ui/button"
import {
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
} from "@/components/ui/menu"
import CreateWeaveModal from "./CreateWeaveModal"

export default function WeaveSelector() {
  const router = useRouter()
  const params = useParams()
  const currentWeaveId = params.weaveId as string | undefined
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: weavesData } = useQuery({
    queryFn: () => WeavesAPI.listMyWeaves({ skip: 0, limit: 100 }),
    queryKey: ["weaves"],
  })

  const weaves = weavesData?.data ?? []
  const currentWeave = weaves.find((w) => w.id === currentWeaveId)

  const handleWeaveSwitch = (weaveId: string) => {
    // Navigate to the weave's main page (worlds list)
    router.push(`/weaves/${weaveId}`)
  }

  return (
    <>
      <MenuRoot>
        <MenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            px={3}
            gap={2}
            fontWeight="medium"
            _hover={{ bg: { base: "gray.100", _dark: "gray.700" } }}
          >
            {currentWeave?.icon && (
              <Text fontSize="lg" lineHeight={1}>
                {currentWeave.icon}
              </Text>
            )}
            <Text maxW="200px" truncate>
              {currentWeave?.name || "Select Weave"}
            </Text>
            <FiChevronDown />
          </Button>
        </MenuTrigger>

        <MenuContent minW="250px">
          <Box px={3} py={2} borderBottomWidth={1}>
            <Text fontSize="xs" fontWeight="medium" color="gray.500" textTransform="uppercase">
              Your Weaves
            </Text>
          </Box>

          {weaves.map((weave) => (
            <MenuItem
              key={weave.id}
              value={weave.id}
              onClick={() => handleWeaveSwitch(weave.id)}
              cursor="pointer"
            >
              <Flex align="center" gap={3} flex={1}>
                {weave.icon && (
                  <Text fontSize="lg" lineHeight={1}>
                    {weave.icon}
                  </Text>
                )}
                <Box flex={1}>
                  <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                    {weave.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500" textTransform="capitalize">
                    {weave.user_role}
                  </Text>
                </Box>
                {weave.id === currentWeaveId && (
                  <FiCheck color="var(--chakra-colors-blue-500)" />
                )}
              </Flex>
            </MenuItem>
          ))}

          <MenuSeparator />

          <MenuItem
            value="create-new"
            onClick={() => setIsCreateModalOpen(true)}
            cursor="pointer"
          >
            <Flex align="center" gap={2}>
              <FiPlus />
              <Text fontSize="sm" fontWeight="medium">
                Create New Weave
              </Text>
            </Flex>
          </MenuItem>
        </MenuContent>
      </MenuRoot>

      <CreateWeaveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isRequired={false}
      />
    </>
  )
}
