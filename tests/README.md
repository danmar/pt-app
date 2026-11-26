# Tester

Testerna är skrivna i Gherkin på svenska och körs med Cucumber. Allt som hör till testerna ligger i den här mappen.

## Köra testerna

```sh
cd tests
npm install
npm test            # alla tester
npm run test:gym    # bara testerna för gympass (@gym)
npm run test:logik  # bara logiken (snabbt, ingen webbläsare)
npm run test:ui     # bara appen i webbläsaren (@ui)
```

Testerna körs också på GitHub vid varje push (`.github/workflows/tests.yml`).

## Så är mappen organiserad

```
tests/
├── *.feature          Testfallen, en fil per del av appen
├── steg/              Vad varje Givet/När/Så-rad gör
│   ├── logik.mjs        Förslag, ont, simpass, vecka och omdöme
│   ├── lagring.mjs      Export och import
│   └── webbläsare.mjs   Klick och kontroller i Chromium
├── stöd/              Hjälpkod
│   ├── värld.mjs        Tillstånd för varje scenario, start och stopp av webbläsaren
│   └── server.mjs       Liten server för web/ under UI-testerna
├── cucumber.mjs       Inställningar för Cucumber
└── package.json       Beroenden och npm-skript
```

Stegen i `steg/` importerar koden direkt från `../web/`, så testerna provar samma filer som appen använder.

| Fil | Testar | Steg i |
|---|---|---|
| `nästa-övning.feature` | Förslag på nästa övning under passet | `logik.mjs` |
| `omdöme.feature` | Omdöme och tips efter passet | `logik.mjs` |
| `smärta.feature` | Övningar som tas bort när du har ont, och utrustning hemma | `logik.mjs` |
| `simpass.feature` | Simpassens delar och längd | `logik.mjs` |
| `veckoförslag.feature` | Veckoförslaget, vilodagar och dagar du lagt in själv | `logik.mjs` |
| `lagring.feature` | Export och import av säkerhetskopia | `lagring.mjs` |
| `appen.feature` | Appen i Chromium: start utan konsolfel, flikar, layoutfiler, steg och färgtema | `webbläsare.mjs` |

## Taggar

| Tagg | Betyder |
|---|---|
| `@gym` | Testet handlar om gympass (styrkepass med övningar, set och vikter) |
| `@ui` | Testet öppnar appen i Chromium. Hela `appen.feature` har den taggen. |

En tagg på raden ovanför `Egenskap:` gäller alla scenarier i filen. En tagg ovanför `Scenario:` gäller bara det scenariot.

## Tester för gympass

28 scenarier har taggen `@gym`:

| Fil | Scenarier | Vad som testas |
|---|---|---|
| `nästa-övning.feature` | alla 9 | Förslag på nästa övning: flera muskelgrupper, inga upprepningar, drag efter press, kön, upptagna maskiner, valda muskelgrupper och utrustning, ont i knäna, mål |
| `omdöme.feature` | alla 4 | Personbästa, tips om att öka vikten, första gången en övning körs, balans mellan press och drag |
| `smärta.feature` | 2 (8 med exemplen) | Knäböj och benspark när knäna gör ont, bänkpress när axlarna gör ont |
| `veckoförslag.feature` | 1 | Styrkedagar läggs inte dag efter dag |
| `lagring.feature` | 1 | Ett pågående pass kommer inte med i säkerhetskopian |
| `appen.feature` | 5 | Gym-sidan går att öppna, en övning som läggs till under passet visas utan set och reps, set, reps och vikt anges en gång per övning, Set klart och Ångra, enbensövningar med höger och vänster ben var för sig |

Testerna för simpass, steg, färgtema och fysioövningar har inte taggen.

## Lägga till ett test

1. Skriv ett scenario i rätt `.feature`-fil, eller skapa en ny fil som börjar med `# language: sv`.
2. Sätt `@gym` ovanför scenariot om det handlar om gympass.
3. Kör `npm test`. Om ett steg saknas skriver Cucumber ut ett förslag på kod som du kan klistra in i en fil i `steg/`.
