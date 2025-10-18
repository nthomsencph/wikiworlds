"use client"

import { ChakraProvider } from "@chakra-ui/react"
import React, { type PropsWithChildren } from "react"
import { system } from "../../theme"
import { ColorModeProvider } from "./color-mode"
import { Toaster } from "./toaster"
import { ClientOnly } from "../client-only"

export function CustomProvider(props: PropsWithChildren) {
  return (
    <ChakraProvider value={system}>
      <ClientOnly
        fallback={
          <div suppressHydrationWarning style={{ opacity: 0 }}>
            {props.children}
          </div>
        }
      >
        <ColorModeProvider
          defaultTheme="system"
          storageKey="chakra-ui-color-mode"
          enableSystem={true}
        >
          {props.children}
        </ColorModeProvider>
      </ClientOnly>
      <Toaster />
    </ChakraProvider>
  )
}
