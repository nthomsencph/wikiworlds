"use client"

import { Drawer, Portal, Tabs } from "@chakra-ui/react"
import { CloseButton } from "@/components/ui/close-button"

import useAuth from "@/hooks/useAuth"
import CoreSettings from "@/components/UserSettings/CoreSettings"
import Appearance from "@/components/UserSettings/Appearance"

const tabsConfig = [
  { value: "core", title: "Core", component: CoreSettings },
  { value: "appearance", title: "Appearance", component: Appearance },
]

interface UserSettingsDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserSettingsDrawer({
  isOpen,
  onClose,
}: UserSettingsDrawerProps) {
  const { user: currentUser } = useAuth()

  if (!currentUser) {
    return null
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      placement="end"
      size="xs"
    >
      <Portal>
        <Drawer.Backdrop />
        <Drawer.Positioner>
          <Drawer.Content
            bg={{ base: "white", _dark: "black" }}
            borderColor={{ base: "gray.200", _dark: "white" }}
          >
            <Drawer.Body>
              <Tabs.Root defaultValue="core" variant="subtle">
                <Tabs.List mt={1} mb={4}>
                  {tabsConfig.map((tab) => (
                    <Tabs.Trigger
                      key={tab.value}
                      value={tab.value}
                      _focus={{ outline: "none" }}
                    >
                      {tab.title}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
                {tabsConfig.map((tab) => (
                  <Tabs.Content key={tab.value} value={tab.value}>
                    <tab.component />
                  </Tabs.Content>
                ))}
              </Tabs.Root>
            </Drawer.Body>
            <Drawer.CloseTrigger asChild position="absolute" top={4} right={4}>
              <CloseButton size="sm" />
            </Drawer.CloseTrigger>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
