import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...compat.config({
    extends: ["next/core-web-vitals"],
    rules: {
      "@next/next/no-img-element": "off",
      "react/no-unescaped-entities": "off",
    },
  }),
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "postcss.config.mjs", "tailwind.config.*"],
  },
];

export default config;