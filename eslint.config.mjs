import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["hooks/useMountEffect.ts"],
    rules: {
      "react-hooks/exhaustive-deps": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", ".open-next/**", ".wrangler/**", "next-env.d.ts", "reference/**"]),
]);

export default eslintConfig;
