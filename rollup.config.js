import typescript from "rollup-plugin-typescript2";
import alias from "@rollup/plugin-alias";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config = [
  // ES Module build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.esm.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      alias({
        entries: [
          { find: "@", replacement: resolve(__dirname, "./src") },
          {
            find: "@types",
            replacement: resolve(__dirname, "./src/shared/types/index"),
          },
          {
            find: "@errors",
            replacement: resolve(__dirname, "./src/shared/errors/index"),
          },
          {
            find: "@constants",
            replacement: resolve(__dirname, "./src/shared/constants/index"),
          },
          {
            find: "@utils",
            replacement: resolve(__dirname, "./src/shared/utils/index"),
          },
          {
            find: "@shared",
            replacement: resolve(__dirname, "./src/shared/index"),
          },
          {
            find: "@validation",
            replacement: resolve(__dirname, "./src/shared/validation/index"),
          },
          {
            find: "@client",
            replacement: resolve(__dirname, "./src/client/index"),
          },
          {
            find: "@webhook",
            replacement: resolve(__dirname, "./src/features/webhook/index"),
          },
          {
            find: "@invoice",
            replacement: resolve(__dirname, "./src/features/invoice/index"),
          },
          {
            find: "@payment",
            replacement: resolve(__dirname, "./src/features/payment/index"),
          },
        ],
      }),
      typescript({
        tsconfig: "./tsconfig.build.json",
        clean: true,
      }),
    ],
    external: ["axios", "tiny-typed-emitter", "zod"],
  },
  // CommonJS build
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "auto",
    },
    plugins: [
      alias({
        entries: [
          { find: "@", replacement: resolve(__dirname, "./src") },
          {
            find: "@types",
            replacement: resolve(__dirname, "./src/shared/types/index"),
          },
          {
            find: "@errors",
            replacement: resolve(__dirname, "./src/shared/errors/index"),
          },
          {
            find: "@constants",
            replacement: resolve(__dirname, "./src/shared/constants/index"),
          },
          {
            find: "@utils",
            replacement: resolve(__dirname, "./src/shared/utils/index"),
          },
          {
            find: "@shared",
            replacement: resolve(__dirname, "./src/shared/index"),
          },
          {
            find: "@validation",
            replacement: resolve(__dirname, "./src/shared/validation/index"),
          },
          {
            find: "@client",
            replacement: resolve(__dirname, "./src/client/index"),
          },
          {
            find: "@webhook",
            replacement: resolve(__dirname, "./src/features/webhook/index"),
          },
          {
            find: "@invoice",
            replacement: resolve(__dirname, "./src/features/invoice/index"),
          },
          {
            find: "@payment",
            replacement: resolve(__dirname, "./src/features/payment/index"),
          },
        ],
      }),
      typescript({
        tsconfig: "./tsconfig.build.json",
        clean: true,
      }),
    ],
    external: ["axios", "tiny-typed-emitter", "zod"],
  },
];

export default config;
