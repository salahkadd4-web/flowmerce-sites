// Globales de vitest (it, expect, describe…) pour tsc.
// Les tests ne font pas `import … from "vitest"` : sous Windows, un terminal ouvert
// avec une lettre de lecteur en minuscule (c:\) charge vitest deux fois et l import
// direct échoue (« failed to find the current suite »). Les globales fonctionnent.
/// <reference types="vitest/globals" />
