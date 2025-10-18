"use client"

import {
  Box,
  Container,
  Flex,
  Heading,
  IconButton,
  Input,
  Text,
} from "@chakra-ui/react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { FiSearch, FiMenu } from "react-icons/fi"

import useAuth from "@/hooks/useAuth"
import WeaveSelector from "@/components/Weaves/WeaveSelector"
import UserMenu from "./UserMenu"

interface WeaveNavbarProps {
  weaveName?: string
  worldName?: string
}

export default function WeaveNavbar({ weaveName, worldName }: WeaveNavbarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <Box
      bg="rgba(0, 0, 0, 0.01)"
      backdropFilter="blur(30px)"
      // borderBottom="1px solid rgba(255, 255, 255, 0.1)"@
      position="sticky"
      top={0}
      zIndex={100}
      css={{
        WebkitBackdropFilter: "blur(20px)"
      }}
    >
      <Container maxW="container.xl">
        <Flex h={12} align="center" justify="space-between">
          {/* Left: Logo + Weave Selector */}
          <Flex align="center" gap={4}>
            <Link href="/weaves">
              <Heading size="md" fontWeight="semibold">
                WikiWorlds
              </Heading>
            </Link>

            <Text color="gray.300">|</Text>

            <WeaveSelector />
          </Flex>

          {/* Right: Search + User Menu */}
          <Flex align="center" gap={3}>
            <IconButton
              variant="outline"
              size="sm"
              display={{ base: "flex", md: "none" }}
              aria-label="Search"
            >
              <FiSearch />
            </IconButton>
            <UserMenu />
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}
