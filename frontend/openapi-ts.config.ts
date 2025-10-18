import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "./openapi.json",
  output: "./src/client",
  plugins: [
    {
      name: "@hey-api/sdk",
      asClass: true,
      methodNameBuilder: (operation) => {
        // @ts-ignore
        let name: string = operation.name
        // @ts-ignore
        const service: string = operation.service

        if (service && name.toLowerCase().startsWith(service.toLowerCase())) {
          name = name.slice(service.length)
        }

        return name.charAt(0).toLowerCase() + name.slice(1)
      },
    },
    {
      name: "legacy/axios", // This is how we specify the client in the new version
    },
  ],
})
