import { Box, Flex, Icon, Text } from "@chakra-ui/react"
import Link from "next/link"
import { FiBriefcase, FiHome } from "react-icons/fi"
import type { IconType } from "react-icons/lib"

const items = [
  { icon: FiHome, title: "Dashboard", path: "/" },
  { icon: FiBriefcase, title: "Items", path: "/items" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

interface Item {
  icon: IconType
  title: string
  path: string
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const finalItems: Item[] = items

  const listItems = finalItems.map(({ icon, title, path }) => (
    <Link key={title} href={path} onClick={onClose}>
      <Flex
        gap={4}
        px={4}
        py={2}
        _hover={{
          background: "gray.subtle",
        }}
        alignItems="center"
        fontSize="sm"
      >
        <Icon as={icon} alignSelf="center" />
        <Text ml={2}>{title}</Text>
      </Flex>
    </Link>
  ))

  return <Box>{listItems}</Box>
}

export default SidebarItems
