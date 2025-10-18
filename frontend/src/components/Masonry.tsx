import React, { useMemo } from "react"
import { Card, Box, Text, Flex, Image } from "@chakra-ui/react"

import "./Masonry.css"

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  }

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit)
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? "" : "s"} ago`
    }
  }

  return "just now"
}

interface Item {
  id: string
  img: string
  url: string
  title?: string
  entryTypeName?: string
  updatedAt?: string
  characterCount?: number
}

interface MasonryProps {
  items: Item[]
}

const Masonry: React.FC<MasonryProps> = ({ items }) => {
  const COLUMNS = 4

  // Reorder items so CSS columns (which fills column-by-column) appears to fill row-by-row
  const reorderedItems = useMemo(() => {
    const rowCount = Math.ceil(items.length / COLUMNS)
    const columns: Item[][] = Array.from({ length: COLUMNS }, () => [])

    // Fill items row by row, then redistribute into columns
    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const index = row * COLUMNS + col
        if (index < items.length) {
          columns[col].push(items[index])
        }
      }
    }

    // Flatten columns back into a single array (column-by-column)
    return columns.flat()
  }, [items])

  return (
    <div className="list">
      {reorderedItems.map((item) => (
        <Box
          key={item.id}
          className="item-wrapper"
          onClick={() => window.open(item.url, "_blank", "noopener")}
        >
          <Card.Root
            overflow="hidden"
            cursor="pointer"
            bg="rgba(0, 0, 0, 0.5)"
            borderRadius="xl"
            boxShadow="0px 10px 50px -10px rgba(0, 0, 0, 0.2)"
            transition="transform 0.2s"
            _hover={{ transform: "scale(0.98)" }}
          >
            <Image
              src={item.img}
              alt={item.title || ""}
              objectFit="cover"
              w="100%"
            />
            {(item.title || item.entryTypeName || item.updatedAt) && (
              <Card.Body gap="2">
                {item.title && (
                  <Card.Title
                    color="white"
                    fontSize="md"
                    textOverflow="ellipsis"
                    overflow="hidden"
                    whiteSpace="nowrap"
                  >
                    {item.title}
                  </Card.Title>
                )}
                {(item.entryTypeName || item.updatedAt) && (
                  <Flex align="center" gap={2} fontSize="sm">
                    {item.entryTypeName && (
                      <Text color="whiteAlpha.700" fontWeight="medium">
                        {item.entryTypeName}
                      </Text>
                    )}
                    {item.entryTypeName && item.updatedAt && (
                      <Text color="whiteAlpha.400">|</Text>
                    )}
                    {item.updatedAt && (
                      <Text color="whiteAlpha.500">
                        {formatTimeAgo(item.updatedAt)}
                      </Text>
                    )}
                  </Flex>
                )}
              </Card.Body>
            )}
          </Card.Root>
        </Box>
      ))}
    </div>
  )
}

export default Masonry
