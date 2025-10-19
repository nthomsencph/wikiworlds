import {
  createSystem,
  defaultConfig,
  defineRecipe,
  defineSlotRecipe,
} from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

// Define IconButton recipe to inherit button styles
const iconButtonRecipe = defineRecipe({
  base: {
    borderRadius: "full",
  },
})

// Define Dialog recipe for black background in dark mode
const dialogRecipe = defineSlotRecipe({
  slots: [
    "backdrop",
    "positioner",
    "content",
    "header",
    "body",
    "footer",
    "closeTrigger",
  ],
  base: {
    content: {
      bg: { base: "white", _dark: "black" },
      borderColor: { base: "gray.200", _dark: "white" },
    },
  },
})

// Define Drawer recipe for black background in dark mode
const drawerRecipe = defineSlotRecipe({
  slots: [
    "backdrop",
    "positioner",
    "content",
    "header",
    "body",
    "footer",
    "closeTrigger",
  ],
  base: {
    content: {
      bg: { base: "white", _dark: "black" },
      borderColor: { base: "gray.200", _dark: "white" },
    },
  },
})

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
      backgroundColor: "#000000",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
      backgroundColor: "#000000",
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#009688" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
      iconButton: iconButtonRecipe,
    },
    slotRecipes: {
      dialog: dialogRecipe,
      drawer: drawerRecipe,
    },
  },
})
