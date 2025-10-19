import { Tooltip as ChakraTooltip } from "@chakra-ui/react"
import * as React from "react"

export interface TooltipProps extends ChakraTooltip.RootProps {
  content: React.ReactNode
  contentProps?: ChakraTooltip.ContentProps
  children: React.ReactNode
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  function Tooltip(props, ref) {
    const { content, contentProps, children, ...rest } = props
    return (
      <ChakraTooltip.Root {...rest}>
        <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content
            ref={ref}
            bg="gray.800"
            _dark={{ bg: "black", color: "white" }}
            px={3}
            py={2}
            borderRadius="lg"
            fontSize="sm"
            {...contentProps}
          >
            {content}
          </ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </ChakraTooltip.Root>
    )
  }
)
