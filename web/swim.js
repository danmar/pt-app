// Föreslår simpass för en 25-metersbassäng. Räknar med ungefär 30 m per minut
// inklusive vila, vilket passar en vanlig motionssimmare.

export const SWIM_STYLES = {
  mixed: 'Blandat',
  crawl: 'Crawl',
  breast: 'Bröstsim',
  back: 'Ryggsim',
};

export const SWIM_FOCUS = {
  endurance: 'Uthållighet',
  speed: 'Fart',
  technique: 'Teknik',
};

const DRILLS = {
  mixed: ['benspark med platta', 'en arm i taget', 'långa glid efter varje tag'],
  crawl: ['catch-up (vänta in handen framme)', 'andning var 3:e tag', 'benspark med platta', 'knyt nävarna och känn underarmen'],
  breast: ['glid 2 sekunder efter varje tag', 'benspark med platta', 'två bentag per armtag'],
  back: ['en arm i taget', 'benspark med armarna längs sidan', 'räkna tagen per längd och försök få färre'],
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const round50 = (m) => Math.max(50, Math.round(m / 50) * 50);

/** @returns {{ title: string, text: string, meters: number, done: boolean }[]} */
export function suggestSwim({ minutes, style, focus }) {
  const total = minutes * 30;
  const name = style === 'mixed' ? 'valfritt simsätt' : SWIM_STYLES[style].toLowerCase();
  const warm = round50(total * 0.2);
  const cool = minutes >= 40 ? 200 : 100;
  const drillReps = minutes >= 40 ? 6 : 4;
  const drill = drillReps * 50;
  let main = total - warm - cool - drill;
  const blocks = [
    { title: 'Uppvärmning', text: `${warm} m lugnt, blanda gärna simsätt`, meters: warm },
    { title: 'Teknik', text: `${drillReps} × 50 m ${pick(DRILLS[style])}, 15 s vila`, meters: drill },
  ];

  if (focus === 'speed') {
    const sprints = Math.max(4, Math.min(12, Math.round((main * 0.5) / 50)));
    const rest = round50(main - sprints * 50);
    blocks.push({ title: 'Fart', text: `${sprints} × 50 m snabbt ${name}, 30 s vila`, meters: sprints * 50 });
    if (rest >= 100) {
      const n = Math.max(1, Math.round(rest / 100));
      blocks.push({ title: 'Tempo', text: `${n} × 100 m i jämnt, ganska högt tempo, 20 s vila`, meters: n * 100 });
    }
  } else if (focus === 'technique') {
    const n = Math.max(2, Math.round(main / 100));
    blocks.push({ title: 'Huvuddel', text: `${n} × 100 m ${name} med fokus på långa, lugna tag, 20 s vila`, meters: n * 100 });
  } else {
    const len = main >= 800 ? 200 : 100;
    const n = Math.max(1, Math.round(main / len));
    main = n * len;
    blocks.push({ title: 'Huvuddel', text: `${n} × ${len} m ${name} i jämnt tempo, 30 s vila`, meters: main });
  }

  blocks.push({ title: 'Nedvarvning', text: `${cool} m mycket lugnt, valfritt simsätt`, meters: cool });
  return blocks.map((b) => ({ ...b, done: false }));
}
