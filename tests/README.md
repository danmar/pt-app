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
│   ├── gympass.mjs      Ett pågående gympass i Chromium
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
| `gympass.feature` | Ett pågående gympass i Chromium: lägga till övningar, set, reps och vikt, Set klart, enbensövningar, övningsvyns ordning och kroppskarta | `gympass.mjs` |
| `nästa-övning.feature` | Förslag på nästa övning under passet | `logik.mjs` |
| `omdöme.feature` | Omdöme och tips efter passet | `logik.mjs` |
| `smärta.feature` | Övningar som tas bort när du har ont, och utrustning hemma | `logik.mjs` |
| `simpass.feature` | Simpassens delar och längd | `logik.mjs` |
| `lagring.feature` | Export och import av säkerhetskopia | `lagring.mjs` |
| `appen.feature` | Appen i Chromium: start utan konsolfel, flikar, blockordning, steg och färgtema | `webbläsare.mjs` |

## Taggar

| Tagg | Betyder |
|---|---|
| `@gym` | Testet handlar om gympass (styrkepass med övningar, set och vikter) |
| `@ui` | Testet öppnar appen i Chromium. Hela `appen.feature` och `gympass.feature` har den taggen. |

En tagg på raden ovanför `Egenskap:` gäller alla scenarier i filen. En tagg ovanför `Scenario:` gäller bara det scenariot.

## Tester för gympass

Testerna av själva passet ligger i **`gympass.feature`**. Varje scenario börjar med samma `Bakgrund`: appen öppnas med tom data, man trycker på **Gym** på startsidan och sedan på **Börja träna**. Scenariot startar alltså i ett nytt, pågående gympass.

| Scenario i `gympass.feature` | Vad som testas |
|---|---|
| Ett nytt pass föreslår uppvärmning och har en kö | Passet startar utan fel |
| En övning som läggs till under passet visas utan set och reps | Lägg till övning visar övningen utan set och reps, knappen heter Lägg till och övningen hamnar i kön |
| En styrkeövning anges med set, reps och vikt en gång | Set, reps och vikt anges en gång för hela övningen |
| Set klart bockar av ett set i taget | Set klart och Ångra senaste set |
| En enbensövning anges för höger och vänster ben var för sig | Egna värden för höger och vänster ben |
| Övningsvyn visar namn, loggning, figur och muskler i den ordningen | Ordningen i övningsvyn, halv kroppskarta som inte går att trycka på |
| En övning som läggs till visar namnet överst, figuren och musklerna | Vyn för att lägga till en övning: namnet överst utan tid, bara figur och kroppskarta |
| Roddmaskinen har ingen knapp för att lägga till set | Ingen "+ Lägg till set" för övningar i minuter |
| Plankan har kvar knappen för att lägga till set | "+ Lägg till set" finns för övningar i sekunder |
| Ett nytt pass börjar med favoriterna i kön | Favoriterna för gym ligger i kön när passet startar |
| En övning blir favorit med stjärnan när den körs | Stjärnan "Favorit på gym" i övningsvyn |

Logiken bakom passet testas utan webbläsare i andra filer. De scenarierna har också taggen `@gym`:

| Fil | Scenarier | Vad som testas |
|---|---|---|
| `nästa-övning.feature` | alla 7 | Förslag på nästa övning: flera muskelgrupper, inga upprepningar, drag efter press, kön, valda muskelgrupper och utrustning, ont i knäna |
| `omdöme.feature` | alla 4 | Personbästa, tips om att öka vikten, första gången en övning körs, balans mellan press och drag |
| `smärta.feature` | 2 (8 med exemplen) | Knäböj och benspark när knäna gör ont, bänkpress när axlarna gör ont |
| `lagring.feature` | 1 | Ett pågående pass kommer inte med i säkerhetskopian |

`npm run test:gym` kör alla 31.

## Lägga till ett test

1. Skriv ett scenario i rätt `.feature`-fil, eller skapa en ny fil som börjar med `# language: sv`.
2. Ett test som börjar i ett pågående gympass skriver du i `gympass.feature`, så får det Bakgrunden automatiskt. Andra tester som handlar om gympass får `@gym` ovanför scenariot.
3. Kör `npm test`. Om ett steg saknas skriver Cucumber ut ett förslag på kod som du kan klistra in i en fil i `steg/`.
