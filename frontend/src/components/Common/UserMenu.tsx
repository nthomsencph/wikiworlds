import { Box, Flex, IconButton } from "@chakra-ui/react"
import Link from "next/link"
import { FiLogOut, FiUser } from "react-icons/fi"

import useAuth from "@/hooks/useAuth"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"

const UserMenu = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    logout()
  }

  return (
    <>
      {/* Desktop */}
      <Flex>
        <MenuRoot>
          <MenuTrigger asChild>
            <IconButton
              data-testid="user-menu"
              variant="ghost"
              size="sm"
              aria-label="User menu"
            >
              <FiUser fontSize="16" />
            </IconButton>
          </MenuTrigger>

          <MenuContent borderRadius="2xl" overflow="hidden">
            <Link href="/settings" style={{ textDecoration: "none" }}>
              <MenuItem
                closeOnSelect
                value="user-settings"
                gap={2}
                py={2}
                style={{ cursor: "pointer" }}
                _focus={{ outline: "none" }}
              >
                <FiUser fontSize="18px" />
                <Box flex="1">Account</Box>
              </MenuItem>
            </Link>

            <MenuItem
              value="logout"
              gap={2}
              py={2}
              onClick={handleLogout}
              style={{ cursor: "pointer" }}
              _focus={{ outline: "none" }}
            >
              <FiLogOut />
              Log Out
            </MenuItem>
          </MenuContent>
        </MenuRoot>
      </Flex>
    </>
  )
}

export default UserMenu
