# Min PT – personlig tränare i mobilen

En webbapp (PWA) som du lägger på hemskärmen på din iPhone. Du behöver ingen App Store, Mac eller Apple Developer-konto.

- **Startsida:** välj vad du ska göra, Gym, Hemma, Simma eller Planera. Här ser du också dagens plan och dina steg.
- **Styrka (gym och hemma):** inga färdiga program. Du väljer utrustning (kroppsvikt, hantlar, skivstång, maskiner och kabel) och vilka muskelgrupper du vill köra. Under passet föreslår appen nästa övning utifrån det du redan har kört idag. Den väljer muskelgrupper du inte har kört än, ger motvikt (till exempel rodd efter bänkpress), ger nya vinklar och sparar isoleringsövningar till slutet. Du kan lägga övningar i en kö och flytta om dem. Är en maskin upptagen trycker du på klockan, så flyttas övningen sist och du får andra förslag.
- **Passtyper:** Styrka (set och vila), Cirkel (stationer där muskelgrupperna växlar), HIIT (korta intensiva intervaller) och Kondition (längre intervaller). Cirkel, HIIT och Kondition körs med en intervalltimer som räknar ner, piper och går vidare själv.
- **Simma:** föreslår ett simpass (20/40/60 min) med uppvärmning, teknik, huvuddel och nedvarvning. Du bockar av delarna och sparar passet. Du kan också logga ett simpass direkt.
- **Planera:** lägg upp en veckoplan och spara pass till senare. Ett sparat pass kan du lägga in på en veckodag.
- **Skonsamt för knäna** (påslaget som standard): förslagen hoppar över knäböj, utfall, marklyft och hopp. I stället används knävänliga övningar som raka benlyft, sidoliggande benlyft, tåhävningar, höftlyft, motionscykel och marsch på stället.
- **Fysiopass:** "Fysio gym" (benspark, bencurl och benpress med ett ben) och "Fysio hemma" (kort enbensknäböj och högt väggsittande) finns under Planera. Benövningarna ligger alltid först och fylls på med förslag för överkropp och bål.
- **Träna säkert:** varje övning har en lista, ”Tänk på”, med vanliga misstag och hur du skyddar knän, rygg och axlar. En guide tar upp uppvärmning, en smärtregel för knäna, när du ska stoppa direkt, teknik och hur du ökar belastningen. Cirkel- och HIIT-passen börjar med en uppvärmning.
- **Steg:** skriv in dagens steg från Hälsa-appen. Startsidan visar hur nära du är ditt stegmål och de senaste 7 dagarna.
- **Animationer:** varje övning visas med en animerad streckgubbe och en kort instruktion.
- **Under passet:** logga kg och reps per set. En vilotimer piper när det är dags för nästa set, och skärmen hålls tänd. Svep mellan övningarna. Stängs appen mitt i passet återupptas det nästa gång du öppnar den.
- **Logg:** historik över pass och promenader, med ett diagram över aktiva minuter de senaste 7 dagarna. Promenader loggar du för hand.
- **Fungerar offline**, och all data sparas bara på telefonen. Du kan exportera och importera en säkerhetskopia under Inställningar.

## Filer

```
web/
  index.html            Sidan
  styles.css            Utseende (ljust och mörkt läge)
  app.js                Vyer, pass, logg, inställningar
  exercises.js          Övningar och animationsställningar
  figure.js             Ritar och animerar streckgubbarna (SVG)
  planner.js            Logiken för passförslag
  swim.js               Förslag på simpass
  safety.js             Säkerhetsråd per övning och guiden Träna säkert
  workouts.js           Cirkel, HIIT och kondition (stationer och timersteg)
  storage.js            Sparar data i telefonen
  sw.js                 Offlinestöd (höj VERSION när du ändrar filer)
  manifest.webmanifest  Appnamn och ikoner för hemskärmen
  icons/
```

Det finns inget byggsteg. Allt är vanlig HTML, CSS och JavaScript.

## Testa på datorn

```sh
cd web
python3 -m http.server 8000
```

Öppna sedan http://localhost:8000. Appen måste köras via en server, så det fungerar inte att dubbelklicka på `index.html`.

## Lägga ut appen gratis

Appen måste ligga på en **https**-adress för att fungera som app på telefonen. Två gratis sätt:

**A. Netlify Drop (enklast, inget konto med git behövs)**
1. Gå till https://app.netlify.com/drop
2. Dra mappen `web/` till sidan.
3. Du får en adress, t.ex. `https://något-namn.netlify.app`.

**B. GitHub Pages (uppdateras automatiskt när du pushar)**
1. Skapa ett repo på GitHub och pusha hela projektet till grenen `main`.
2. Gå till repots *Settings › Pages* och välj *Source: GitHub Actions*.
3. Arbetsflödet `.github/workflows/pages.yml` publicerar `web/` på `https://<användarnamn>.github.io/<repo>/`.

## Installera på iPhone

1. Öppna adressen i **Safari**.
2. Tryck på **Dela** (fyrkanten med pil uppåt) och välj **Lägg till på hemskärmen**.
3. Starta Min PT från hemskärmen. Den öppnas i helskärm som en vanlig app.

> Tips: Använd appen från hemskärmen, inte i en Safari-flik. Då raderar iOS inte datan automatiskt.
> Exportera ändå en säkerhetskopia då och då.

## Uppdatera appen

Ändra filerna och höj `VERSION` i `web/sw.js` (t.ex. `minpt-v12`). Publicera sedan igen. Telefonen hämtar den nya versionen nästa gång appen öppnas, och den börjar gälla gången därpå.
