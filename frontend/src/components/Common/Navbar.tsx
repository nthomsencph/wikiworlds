import { Button, Flex, Image, useBreakpointValue } from "@chakra-ui/react"
import Link from "next/link"
import { FiUsers } from "react-icons/fi"

import useAuth from "@/hooks/useAuth"
import UserMenu from "./UserMenu"

const Logo = "/assets/images/fastapi-logo.svg"

function Navbar() {
  const display = useBreakpointValue({ base: "none", md: "flex" })
  const { user } = useAuth()

  return (
    <Flex
      display={display}
      justify="space-between"
      position="sticky"
      color="white"
      align="center"
      bg="bg.muted"
      w="100%"
      top={0}
      p={4}
    >
      <Link href="/">
        <Image src={Logo} alt="Logo" maxW="3xs" p={2} />
      </Link>
      <Flex gap={2} alignItems="center">
        {user?.is_superuser && (
          <Link href="/admin">
            <Button
              variant="ghost"
              size="sm"
              colorPalette="gray"
              bg={{ base: "gray.100", _dark: "gray.700" }}
              _hover={{ bg: { base: "gray.200", _dark: "gray.600" } }}
            >
              <FiUsers fontSize="16px" />
              Admin
            </Button>
          </Link>
        )}
        <UserMenu />
      </Flex>
    </Flex>
  )
}

export default Navbar
