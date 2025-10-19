"use client"

import { Box, Flex, IconButton } from "@chakra-ui/react"
import { useState } from "react"
import { FiLogOut, FiUser, FiShield } from "react-icons/fi"
import { useRouter } from "next/navigation"

import useAuth from "@/hooks/useAuth"
import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from "../ui/menu"
import UserSettingsDrawer from "./UserSettingsDrawer"

const UserMenu = () => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleLogout = async () => {
    logout()
  }

  const handleOpenSettings = () => {
    setIsSettingsOpen(true)
  }

  const handleAdminClick = () => {
    router.push("/admin")
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
              _dark={{ color: "white", _hover: { color: "gray.700" } }}
            >
              <FiUser fontSize="16" />
            </IconButton>
          </MenuTrigger>

          <MenuContent borderRadius="2xl" overflow="hidden">
            <MenuItem
              closeOnSelect
              value="user-settings"
              gap={2}
              py={2}
              onClick={handleOpenSettings}
              style={{ cursor: "pointer" }}
              _focus={{ outline: "none" }}
            >
              <FiUser fontSize="18px" />
              <Box flex="1">Account</Box>
            </MenuItem>

            {user?.is_superuser && (
              <MenuItem
                closeOnSelect
                value="admin"
                gap={2}
                py={2}
                onClick={handleAdminClick}
                style={{ cursor: "pointer" }}
                _focus={{ outline: "none" }}
              >
                <FiShield fontSize="18px" />
                <Box flex="1">Admin</Box>
              </MenuItem>
            )}

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

      <UserSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}

export default UserMenu
