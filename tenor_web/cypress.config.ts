import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    defaultCommandTimeout: 10000, // Increase default timeout
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
