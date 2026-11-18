import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-console": "warn",
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
