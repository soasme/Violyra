const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    include: [
      "**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "**/*.__test__.?(c|m)[jt]s?(x)",
    ],
  },
});
