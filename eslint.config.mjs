import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

/**
 * `npm run lint` fallaba: el proyecto tenía `eslint-config-next` instalado pero
 * ningún archivo de configuración, así que ESLint 9 abortaba antes de revisar
 * nada. Sin linter no se detectaban ni los imports sin usar ni los avisos de
 * accesibilidad que Next trae por defecto.
 */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    rules: {
      // Las variables descartadas a propósito se marcan con guion bajo
      // (por ejemplo `const { consent: _consent, ...values } = parsed.data`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];

export default config;
