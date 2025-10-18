"use client"

import { Box, Container, Flex, Heading, Text, Input, Textarea, Grid, Image } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { FiPlus, FiGlobe, FiSettings, FiEdit2, FiChevronDown } from "react-icons/fi"
import { motion, AnimatePresence } from "framer-motion"

import { Weaves as WeavesAPI, Worlds as WorldsAPI } from "@/client"
import { Button } from "@/components/ui/button"
import CreateWorldModal from "@/components/Worlds/CreateWorldModal"
import LiquidEther from "@/components/LiquidEther"
import { Field } from "@/components/ui/field"
import AnimatedList from "@/components/AnimatedList"
import DeleteWeaveModal from "@/components/Weaves/DeleteWeaveModal"

const PER_PAGE = 12

export default function WeaveDetail() {
  const router = useRouter()
  const params = useParams()
  const weaveId = params.weaveId as string
  const [page, setPage] = useState(1)
  const [isCreateWorldModalOpen, setIsCreateWorldModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [hasWeaveChanges, setHasWeaveChanges] = useState(false)
  const [isDeleteWeaveModalOpen, setIsDeleteWeaveModalOpen] = useState(false)
  const settingsCategories = ["Weave", "Worlds", "Theme"]

  const { data: weave, isLoading: weaveLoading } = useQuery({
    queryFn: () => WeavesAPI.getWeave({ weaveId }),
    queryKey: ["weave", weaveId],
  })

  const { data: worldsData, isLoading: worldsLoading } = useQuery({
    queryFn: () =>
      WorldsAPI.listWeaveWorlds({
        weaveId,
        skip: (page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
    queryKey: ["worlds", weaveId, { page }],
  })

  const worlds = worldsData?.data ?? []
  const count = worldsData?.count ?? 0

  if (weaveLoading || worldsLoading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.600">Loading...</Text>
      </Container>
    )
  }

  if (!weave) {
    return (
      <Container maxW="container.xl" py={12}>
        <Text color="gray.600">Weave not found</Text>
      </Container>
    )
  }

  return (
    <>
      {/* Fixed background layer */}
      <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={0}>
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          autoDemo={true}
          autoSpeed={0.2}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.2}
          style={{ width: '100%', height: '100%' }}
        />
      </Box>

      {/* Snap scroll container */}
      <Box
        position="relative"
        zIndex={1}
        height="100vh"
        overflowY="scroll"
        css={{
          scrollSnapType: 'y mandatory',
          scrollSnapStop: 'always',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {/* Section 1: Hero - Weave Name & Description */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="100vh"
          maxH="100vh"
          px={8}
          position="relative"
          css={{
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always'
          }}
        >
          <Container maxW="container.md" textAlign="center">
            {weave.icon && (
              <Text fontSize="8xl" mb={8} lineHeight={1}>
                {weave.icon}
              </Text>
            )}
            <Heading
              size="4xl"
              mb={6}
              fontWeight="bold"
            >
              {weave.name}
            </Heading>
            {weave.description && (
              <Text fontSize="2xl" color="gray.100" maxW="2xl" mx="auto">
                {weave.description}
              </Text>
            )}

            {/* Scroll indicator */}
            <Flex direction="column" align="center" mt={16} gap={2}>
              <Text fontSize="sm" color="gray.300">Scroll to explore</Text>
              <FiChevronDown size={24} color="gray" style={{ animation: 'bounce 2s infinite' }} />
            </Flex>
          </Container>
        </Flex>

        {/* Section 2: Worlds Grid */}
        <Box
          minH="100vh"
          maxH="100vh"
          position="relative"
          css={{
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always'
          }}
          display="flex"
          flexDirection="column"
          py={12}
        >
          <Container maxW="container.xl" flex="1" display="flex" flexDirection="column">
            <Flex justify="space-between" align="center" mb={8}>
              <Box>
                <Heading size="xl" mb={2}>
                  Worlds
                </Heading>
              </Box>
            </Flex>

            {worlds.length === 0 ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                flex="1"
                textAlign="center"
              >
                <FiGlobe size={64} color="gray" style={{ marginBottom: '24px' }} />
                <Heading size="lg" mb={2}>
                  No worlds yet
                </Heading>
                <Text color="gray.400" mb={6} maxW="md">
                  Create your first world to start building entries and content.
                </Text>
                <Button
                  colorPalette="blue"
                  onClick={() => setIsCreateWorldModalOpen(true)}
                >
                  <FiPlus />
                  Create World
                </Button>
              </Flex>
            ) : (
              <>
                <Grid
                  templateColumns={{
                    base: "repeat(1, 1fr)",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                    xl: "repeat(4, 1fr)"
                  }}
                  gap={6}
                  flex="1"
                  py={8}
                >
                  {worlds.map((world) => (
                    <Link
                      key={world.id}
                      href={`/weaves/${weaveId}/worlds/${world.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box
                        bg="rgba(54, 54, 54, 0.5)"
                        borderRadius="3xl"
                        overflow="hidden"
                        cursor="pointer"
                        transition="all 0.3s"
                        h="280px"
                        position="relative"
                        className="world-card"
                        css={{
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            background: 'rgba(70, 70, 70, 0.6)'
                          },
                          '&:hover img': {
                            filter: 'grayscale(0%) brightness(1)',
                            opacity: 1
                          }
                        }}
                      >
                        <Box
                          position="relative"
                          h="100%"
                          overflow="hidden"
                        >
                          <Image
                            src={world.cover_image || "/assets/images/default-world.png"}
                            alt={world.name}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                            filter="grayscale(100%) brightness(0.6)"
                            opacity={0.4}
                            transition="all 0.3s"
                          />
                          <Box
                            position="absolute"
                            bottom={0}
                            left={0}
                            right={0}
                            p={4}
                            background="linear-gradient(to top, rgba(0,0,0,0.8), transparent)"
                          >
                            <Flex align="center" gap={2}>
                              {world.icon && (
                                <Text fontSize="xl">{world.icon}</Text>
                              )}
                              <Heading size="md" color="white" lineClamp={1}>
                                {world.name}
                              </Heading>
                            </Flex>
                            {world.description && (
                              <Text color="gray.300" fontSize="sm" mt={1} lineClamp={2}>
                                {world.description}
                              </Text>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Link>
                  ))}
                </Grid>

                {count > PER_PAGE && (
                  <Flex justify="center" align="center" gap={4} mt={8}>
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm" color="gray.400">
                      Page {page} of {Math.ceil(count / PER_PAGE)}
                    </Text>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(count / PER_PAGE)}
                    >
                      Next
                    </Button>
                  </Flex>
                )}
              </>
            )}
          </Container>
        </Box>

        {/* Section 3: Configuration */}
        <Box
          minH="100vh"
          maxH="100vh"
          position="relative"
          css={{
            scrollSnapAlign: 'start',
            scrollSnapStop: 'always'
          }}
          py={12}
          overflowY="auto"
        >
          <Container maxW="container.xl">
            <Flex gap={8} align="start">
              {/* Left: Category selector */}
              <Flex direction="column" gap={6} flexShrink={0}>
                <Heading size="xl" color="white">Configuration</Heading>
                <div style={{ background: 'transparent' }}>
                  <AnimatedList
                    items={settingsCategories}
                    onItemSelect={(item) => setSelectedCategory(item)}
                    showGradients={false}
                    enableArrowNavigation={true}
                    displayScrollbar={false}
                  />
                </div>
              </Flex>

              {/* Right: Settings Panel */}
              <Box flex={1} minH="400px">
                <AnimatePresence mode="wait">
                  {selectedCategory && (
                    <motion.div
                      key={selectedCategory}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full"
                    >
                      <Box
                        p={8}
                        borderRadius="xl"
                        //bg="rgba(17, 17, 17, 0.95)"
                        borderColor="gray.700"
                        backdropFilter="blur(10px)"
                      >
                        {selectedCategory === "Weave" && (
                          <>
                            <Flex justify="space-between" align="center" mb={6}>
                              <Heading size="lg" color="white">
                                Weave Settings
                              </Heading>
                              {hasWeaveChanges && (
                                <Button
                                  size="sm"
                                  bg="rgba(54, 54, 54, 0.9)"
                                  color="white"
                                  borderRadius="full"
                                  px={6}
                                  _hover={{ bg: "rgba(70, 70, 70, 0.9)" }}
                                  onClick={() => {
                                    // Handle save logic here
                                    setHasWeaveChanges(false)
                                  }}
                                >
                                  Save
                                </Button>
                              )}
                            </Flex>

                            <Box mb={6}>
                              <Field label="">
                                <Input
                                  defaultValue={weave.name}
                                  placeholder="Enter weave name"
                                  size="lg"
                                  bg="rgba(54, 54, 54, 0.5)"
                                  borderRadius="full"
                                  border="none"
                                  onChange={() => setHasWeaveChanges(true)}
                                />
                              </Field>
                            </Box>

                            <Box mb={6}>
                              <Field label="">
                                <Input
                                  defaultValue={weave.icon || ""}
                                  placeholder="Enter emoji icon"
                                  size="lg"
                                  bg="rgba(54, 54, 54, 0.5)"
                                  borderRadius="full"
                                  border="none"
                                  onChange={() => setHasWeaveChanges(true)}
                                />
                              </Field>
                            </Box>

                            <Box mb={6}>
                              <Field label="">
                                <Textarea
                                  defaultValue={weave.description || ""}
                                  placeholder="Describe your weave"
                                  rows={4}
                                  bg="rgba(54, 54, 54, 0.5)"
                                  borderRadius="3xl"
                                  border="none"
                                  onChange={() => setHasWeaveChanges(true)}
                                />
                              </Field>
                            </Box>

                            <Button colorPalette="red" variant="outline" size="sm" onClick={() => setIsDeleteWeaveModalOpen(true)}>
                              Delete Weave
                            </Button>
                          </>
                        )}

                        {selectedCategory === "Worlds" && (
                          <>
                            <Flex justify="space-between" align="center" mb={6}>
                              <Heading size="lg" color="white">
                                Worlds settings
                              </Heading>
                              <Button
                                size="sm"
                                bg="rgba(54, 54, 54, 0.9)"
                                color="white"
                                px={6}
                                _hover={{ bg: "rgba(70, 70, 70, 0.9)" }}
                                onClick={() => setIsCreateWorldModalOpen(true)}
                              >
                                <FiPlus />
                                New World
                              </Button>
                            </Flex>

                            <Box mb={4}>

                              <Flex direction="column" gap={3}>
                                {worlds.map((world) => {
                                  const updatedDate = new Date(world.updated_at)
                                  const formattedDate = updatedDate.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })

                                  return (
                                    <Link
                                      key={world.id}
                                      href={`/weaves/${weaveId}/worlds/${world.id}`}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      <Box
                                        p={4}
                                        bg="rgba(54, 54, 54, 0.5)"
                                        borderRadius="3xl"
                                        border="none"
                                        cursor="pointer"
                                        transition="all 0.2s"
                                        _hover={{
                                          bg: "rgba(70, 70, 70, 0.6)",
                                          transform: "translateY(-2px)"
                                        }}
                                      >
                                        <Flex justify="space-between" align="center">
                                          <Box flex={1}>
                                            <Flex align="center" gap={2} mb={1}>
                                              {world.icon && (
                                                <Text fontSize="lg">{world.icon}</Text>
                                              )}
                                              <Text color="white" fontWeight="medium" fontSize="md">
                                                {world.name}
                                              </Text>
                                            </Flex>
                                            {world.description && (
                                              <Text color="gray.400" fontSize="sm" lineClamp={1}>
                                                {world.description}
                                              </Text>
                                            )}
                                          </Box>
                                          <Box textAlign="right">
                                            <Text color="white" fontSize="xs">
                                              Updated {formattedDate}
                                            </Text>
                                            {/* TODO: Add entry count when backend provides it */}
                                          </Box>
                                        </Flex>
                                      </Box>
                                    </Link>
                                  )
                                })}
                              </Flex>
                            </Box>
                          </>
                        )}

                        {selectedCategory === "Theme" && (
                          <>
                            <Heading size="lg" mb={6} color="white">
                              Theme settings
                            </Heading>

                            <Box mb={6}>
                              <Text color="gray.400" fontSize="sm" mb={2}>
                                Background Animation
                              </Text>
                              <Box
                                p={4}
                                bg="rgba(54, 54, 54, 0.5)"
                                borderRadius="3xl"
                                border="none"
                              >
                                <Text color="white" fontWeight="medium" mb={1}>
                                  Liquid Ether
                                </Text>
                                <Text color="gray.400" fontSize="sm">
                                  Currently enabled
                                </Text>
                              </Box>
                            </Box>

                            <Box mb={6}>
                              <Text color="gray.400" fontSize="sm" mb={2}>
                                Card Style
                              </Text>
                              <Box
                                p={4}
                                bg="rgba(54, 54, 54, 0.5)"
                                borderRadius="3xl"
                                border="none"
                              >
                                <Text color="white" fontWeight="medium">
                                  Chroma Grid
                                </Text>
                              </Box>
                            </Box>
                          </>
                        )}
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Box>
            </Flex>
          </Container>
        </Box>
      </Box>

      <CreateWorldModal
        isOpen={isCreateWorldModalOpen}
        onClose={() => setIsCreateWorldModalOpen(false)}
        weaveId={weaveId}
      />

      <DeleteWeaveModal
        isOpen={isDeleteWeaveModalOpen}
        onClose={() => setIsDeleteWeaveModalOpen(false)}
        weaveId={weaveId}
      />

      {/* Add bounce animation */}
      <style jsx global>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </>
  )
}
