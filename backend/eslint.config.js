import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/", "generated/", "node_modules/"] }, // never lint generated code

  js.configs.recommended, // base JS rules
  ...tseslint.configs.recommended, // TS rules
  prettier, // must be LAST: disables rules that conflict with Prettier

  {
    files: ["**/*.ts"],
    languageOptions: { globals: globals.node },
    rules: {
      "@typescript-eslint/no-explicit-any": "error", // your M0 "no any" rule, enforced
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" }, // allows (_req, res) in Express
      ],
      "@typescript-eslint/consistent-type-imports": "error", // pairs with verbatimModuleSyntax
    },
  },
);
