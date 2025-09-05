"use client"

import type { IconButtonProps, SpanProps } from "@chakra-ui/react"
import { ClientOnly, IconButton, Skeleton, Span } from "@chakra-ui/react"
import { ThemeProvider, useTheme } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import * as React from "react"
import { LuMoon, LuSun } from "react-icons/lu"

export interface ColorModeProviderProps extends ThemeProviderProps {}

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="class"
      disableTransitionOnChange
      enableColorScheme={false}
      enableSystem={true}
      themes={["light", "dark", "system"]}
      {...props}
    />
  )
}

export type ColorMode = "light" | "dark" | "system"

export interface UseColorModeReturn {
  colorMode: ColorMode
  setColorMode: (colorMode: ColorMode) => void
  toggleColorMode: () => void
}

export function useColorMode(): UseColorModeReturn {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const toggleColorMode = () => {
    if (theme === "system") {
      // If currently system, switch to the opposite of resolved theme
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    } else {
      // Toggle between light and dark
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }
  return {
    colorMode: (theme || "system") as ColorMode,
    setColorMode: setTheme as (colorMode: ColorMode) => void,
    toggleColorMode,
  }
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === "dark" ? dark : light
}

export function ColorModeIcon() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === "dark" ? <LuMoon /> : <LuSun />
}

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode()
  return (
    <ClientOnly fallback={<Skeleton boxSize="8" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle color mode"
        size="sm"
        ref={ref}
        {...props}
        css={{
          _icon: {
            width: "5",
            height: "5",
          },
        }}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  )
})

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function LightMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme light"
        colorPalette="gray"
        colorScheme="light"
        ref={ref}
        {...props}
      />
    )
  }
)

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(
  function DarkMode(props, ref) {
    return (
      <Span
        color="fg"
        display="contents"
        className="chakra-theme dark"
        colorPalette="gray"
        colorScheme="dark"
        ref={ref}
        {...props}
      />
    )
  }
)
