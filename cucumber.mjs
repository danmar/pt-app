// Inställningar för Cucumber. Kör med `npm test`.
export default {
  paths: ['features/**/*.feature'],
  import: ['features/stöd/**/*.mjs', 'features/steg/**/*.mjs'],
  format: ['progress-bar'],
  formatOptions: { snippetInterface: 'async-await' },
};
