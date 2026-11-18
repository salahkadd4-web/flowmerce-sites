import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // console.warn / console.error servent de journal (blocs écartés, erreurs).
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Préfixe « _ » = valeur volontairement ignorée (props retirées avant rendu).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // Le seed affiche les identifiants de test : la sortie console est voulue.
    files: ["prisma/seed.ts"],
    rules: { "no-console": "off" },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "generated/**", ".superpowers/**"],
  },
];

export default eslintConfig;
