// Inställningar för Cucumber. Kör med `npm test` i mappen tests/.
export default {
  paths: ['*.feature'],
  import: ['stöd/**/*.mjs', 'steg/**/*.mjs'],
  format: ['progress-bar'],
  formatOptions: { snippetInterface: 'async-await' },
};
