// Konditionsaktiviteter utöver gym och hemmaträning: löpning, cykling, längdskidor m.m.
// Simning och promenader har egna sidor och egen loggning (swim.js och walks i storage).

export const ACTS = {
  swim: { name: 'Simning', desc: 'Simpass för bassängen', page: 'swim' },
  run: { name: 'Löpning', desc: 'Lugn jogg eller intervaller', km: true, knees: 2 },
  bike: { name: 'Cykling', desc: 'Ute eller på motionscykel', km: true },
  walk: { name: 'Promenad', desc: 'Rask promenad', page: 'walk' },
  ski: { name: 'Längdskidor', desc: 'Klassiskt eller skejt', km: true, knees: 1 },
  other: { name: 'Annat', desc: 'Dans, padel, vandring …', named: true },
};
// Aktiviteter som har passförslag och loggas i data.cardio.
export const CARDIO_IDS = ['run', 'bike', 'ski', 'other'];

export const CARDIO_FOCUS = {
  easy: 'Lugnt, i pratfart',
  intervals: 'Intervaller',
  start: 'Nybörjare: växla med gång',
};

const VERB = {
  run: { easy: 'jogga', hard: 'spring hårt', light: 'gå', base: 'lugn jogg' },
  bike: { easy: 'cykla lugnt', hard: 'cykla hårt', light: 'trampa lätt', base: 'lätt trampande' },
  ski: { easy: 'åk lugnt', hard: 'åk hårt', light: 'glid lugnt', base: 'lugn åkning' },
  other: { easy: 'håll ett lugnt tempo', hard: 'kör hårt', light: 'ta det lugnt', base: 'lugnt tempo' },
};

/**
 * Passförslag som en lista delar att bocka av: [{ title, text, minutes, done }].
 * Med ont i knäna blir löpningen mjukare (gång-jogg) och utan hopp i intervallerna.
 */
export function suggestCardio({ kind, minutes, focus, pain = {} }) {
  const v = VERB[kind] ?? VERB.other;
  const knees = (pain.knees || 0) >= 2 && (ACTS[kind]?.knees || 0) > 0;
  const warm = Math.min(10, Math.max(5, Math.round(minutes * 0.2)));
  const cool = Math.min(10, Math.max(3, Math.round(minutes * 0.12)));
  const main = Math.max(5, minutes - warm - cool);
  const parts = [{ title: 'Uppvärmning', text: `${cap(v.base)}. Öka tempot lite mot slutet.`, minutes: warm }];

  if (focus === 'intervals' && !(knees && kind === 'run')) {
    const work = main >= 28 ? 4 : main >= 16 ? 3 : 1;
    const rest = main >= 28 ? 3 : main >= 16 ? 2 : 1;
    const reps = Math.max(2, Math.floor(main / (work + rest)));
    parts.push({
      title: `${reps} × ${work} min`,
      text: `${cap(v.hard)} i ${work} min (andfådd men jämnt tempo), ${v.light} ${rest} min mellan.`,
      minutes: reps * (work + rest),
    });
    const left = main - reps * (work + rest);
    if (left >= 3) parts.push({ title: 'Lugnt', text: `${cap(v.easy)} och låt pulsen gå ner.`, minutes: left });
  } else if (focus === 'start' || (knees && kind === 'run')) {
    const block = kind === 'run' ? (knees ? [2, 2] : [3, 1]) : [4, 1];
    const reps = Math.max(2, Math.floor(main / (block[0] + block[1])));
    parts.push({
      title: `${reps} × ${block[0]} + ${block[1]} min`,
      text: kind === 'run'
        ? `Jogga ${block[0]} min, gå ${block[1]} min. Korta steg och mjuka landningar.`
        : `${cap(v.easy)} ${block[0]} min, ${v.light} ${block[1]} min.`,
      minutes: reps * (block[0] + block[1]),
    });
  } else {
    parts.push({ title: `${main} min lugnt`, text: `${cap(v.easy)}. Du ska kunna prata hela meningar.`, minutes: main });
  }
  parts.push({ title: 'Nedvarvning', text: `${cap(v.light)} och stretcha vader och lår efteråt.`, minutes: cool });
  return parts.map((p) => ({ ...p, done: false }));
}

/** Råd från fysioterapeuten om aktiviteten när något gör ont. */
export function cardioAdvice(kind, pain = {}) {
  if ((pain.knees || 0) >= 2 && kind === 'run') return 'Knäna gör ont. Cykling och simning tränar konditionen utan stötar. Springer du ändå: mjukt underlag, korta steg och sluta om det gör mer ont.';
  if ((pain.knees || 0) > 0 && kind === 'run') return 'Lite ont i knäna: välj mjukt underlag, korta steg och gärna gång-jogg. Ont som ökar under passet betyder stopp.';
  if ((pain.knees || 0) > 0 && kind === 'bike') return 'Cykling är skonsamt för knäna. Ställ sadeln så att knät är nästan rakt längst ner och välj lätt motstånd.';
  if ((pain.back || 0) > 0 && kind === 'bike') return 'Ont i ryggen: sitt mer upprätt och ta pauser och sträck på dig.';
  if ((pain.back || 0) >= 2 && kind === 'ski') return 'Ont i ryggen: åk lugnt i plant terräng, och undvik hårda stakningar.';
  return '';
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
