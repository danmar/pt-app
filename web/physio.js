// Den inbyggda fysioterapeuten: anpassar förslagen när du har ont och ger allmänna råd.
// Råden är allmänna. Det din egen fysioterapeut eller läkare säger gäller alltid först.

export const AREAS = {
  shoulders: { name: 'Axlar', the: 'axlarna' },
  back:      { name: 'Rygg',  the: 'ryggen' },
  knees:     { name: 'Knän',  the: 'knäna' },
};
export const AREA_IDS = Object.keys(AREAS);

export const LEVELS = [
  { name: 'Inget', desc: '' },
  { name: 'Lite ont', desc: 'Känns, men högst 3 av 10' },
  { name: 'Ont', desc: 'Mer än 3 av 10, eller värre av träning' },
];

/** Övningar som brukar avlasta och stärka. Första i listan föreslås först. */
export const REHAB = {
  knees: ['straight-leg-raise', 'glute-bridge', 'side-leg-raise', 'calf-raise', 'bike'],
  back: ['bird-dog', 'glute-bridge', 'plank'],
  shoulders: ['external-rotation', 'wall-angel', 'seated-row'],
};

export const ADVICE = {
  knees: {
    skips: ['Knäböj, utfall, hopp och marklyft', 'Vid mer ont även benspark, bencurl och mountain climbers'],
    tips: [
      'Smärtregeln: det är okej att det gör lite ont när du tränar (högst 3 av 10), om det har lagt sig till nästa morgon.',
      'Cykel, crawl och promenader brukar vara skonsamt och håller knäna i rörelse.',
      'Starka lår och en stark höft avlastar knät. Raka benlyft och höftlyft är en bra början.',
      'Byt bentag till crawlben om bröstsim gör ont.',
    ],
    care: [
      'Knät har svullnat mycket eller blivit varmt och rött',
      'Knät låser sig, viker sig eller går inte att belasta',
      'Det började med en vridning, ett fall eller en smäll',
    ],
  },
  back: {
    skips: ['Marklyft, skivstångsrodd och knäböj med stång', 'Vid mer ont även övningar som belastar ryggen lätt, som plankan och crunches'],
    tips: [
      'Fortsätt röra dig. Promenader är bra. Att ligga still gör oftast ryggen sämre.',
      'Håll ryggen neutral och spänn magen lätt när du lyfter.',
      'Vänta med tunga lyft och vridningar med vikt tills det känns bättre.',
      'Fågelhunden och höftlyft stärker bålen utan att belasta ryggen mycket.',
    ],
    care: [
      'Ring 112 vid domningar i underlivet, eller om det är svårt att kissa eller hålla tätt',
      'Benen blir svagare eller domnar',
      'Du har feber, har ramlat, eller värken släpper inte ens på natten',
    ],
  },
  shoulders: {
    skips: ['Press över huvudet, bänkpress, chins och tricepspress över huvudet', 'Vid mer ont även armhävningar, latsdrag och plankan'],
    tips: [
      'Träna under axelhöjd så länge lyft över huvudet gör ont.',
      'Stärk musklerna runt skulderbladet med lätt motstånd: utåtrotation och rodd.',
      'Håll axeln i rörelse men undvik det som gör ont mer än 3 av 10.',
    ],
    care: [
      'Ring 112 vid smärta i axel eller arm tillsammans med tryck över bröstet eller andnöd',
      'Du kan inte lyfta armen efter ett fall eller ryck',
      'Armen domnar eller blir kraftlös',
    ],
  },
};

/** Kroppsdelar där övningen ger viss belastning och du har ont. */
export const painAreasFor = (ex, pain = {}) => AREA_IDS.filter((a) => (pain[a] || 0) > 0 && (ex.load?.[a] || 0) > 0);
