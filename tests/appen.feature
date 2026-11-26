# language: sv
@ui
Egenskap: Appen i webbläsaren
  Appen ska starta utan fel och gå att använda i en mobil webbläsare.

  Scenario: Appen startar utan fel i konsolen
    Givet att jag öppnar appen med tom data
    Så ska jag se texten "Vad vill du göra idag?"
    Och konsolen ska inte ha några fel

  Abstrakt Scenario: Fliken <flik> går att öppna
    Givet att jag öppnar appen med tom data
    När jag trycker på fliken "<flik>"
    Så ska jag se rubriken "<rubrik>"
    Och konsolen ska inte ha några fel

    Exempel:
      | flik          | rubrik        |
      | Planera       | Planera       |
      | Logg          | Logg          |
      | Grafer        | Grafer        |
      | Inställningar | Inställningar |

  Scenario: Layoutfilen styr vilka block som syns och i vilken ordning
    Givet att layoutfilen för startsidan visar "steg, rubrik"
    Och att jag öppnar appen med tom data
    Så ska stegkortet komma före rubriken
    Och knapparna för Gym och Hemma ska inte synas

  Scenario: Ett felstavat block hoppas över med en varning
    Givet att layoutfilen för startsidan visar "rubrik, stg"
    Och att jag öppnar appen med tom data
    Så ska jag se texten "Vad vill du göra idag?"
    Och konsolen ska ha en varning om "okänt block \"stg\""

  Scenario: Lägga in dagens steg
    Givet att jag öppnar appen med tom data
    När jag trycker på "Lägg in"
    Och skriver "9500" i fältet "Antal steg"
    Och trycker på "Spara"
    Så ska jag se texten "9 500"
    Och datan ska ha 9500 steg idag

  Scenario: Byta till mörkt läge
    Givet att jag öppnar appen med tom data
    När jag trycker på fliken "Inställningar"
    Och trycker på "Mörkt"
    Så ska sidan vara i mörkt läge
    Och mörkt läge ska vara sparat

  @gym
  Scenario: Gym-sidan går att öppna från startsidan
    Givet att jag öppnar appen med tom data
    När jag väljer "Gym" på startsidan
    Så ska jag se knappen "Börja träna"
    Och konsolen ska inte ha några fel

  @gym
  Scenario: En styrkeövning anges med set, reps och vikt en gång
    Givet att jag kör övningen "bench-press" med 3 set om 10 reps på 40 kg
    Så ska fälten för set och reps finnas en gång
    När jag trycker på "Fler set"
    Och trycker på "Färre reps"
    Och skriver vikten "42,5"
    Så ska övningen ha 4 set om 9 reps på 42,5 kg
    Och konsolen ska inte ha några fel

  @gym
  Scenario: Set klart bockar av ett set i taget
    Givet att jag kör övningen "bench-press" med 3 set om 10 reps på 40 kg
    När jag trycker på "Set 1 av 3 klart"
    Och trycker på "Set 2 av 3 klart"
    Så ska 2 set vara klara
    När jag trycker på "Ångra senaste set"
    Så ska 1 set vara klara

  @gym
  Scenario: En enbensövning anges för höger och vänster ben var för sig
    Givet att jag kör övningen "single-leg-press" med 3 set om 12 reps på 30 kg
    När jag trycker på "Fler reps" för höger ben
    Och skriver vikten "25" för vänster ben
    Och trycker på "Färre set" för vänster ben
    Så ska övningen ha 3 set om 13 reps på 30 kg för höger ben
    Och ska övningen ha 2 set om 12 reps på 25 kg för vänster ben
    När jag trycker på "Set 1 av 3 klart"
    Så ska 1 set vara klara för varje ben
    Och konsolen ska inte ha några fel

  @gym
  Scenario: En övning som läggs till under passet visas utan set och reps
    Givet att jag har startat ett gympass med kroppsvikt för bröstet
    När jag trycker på "Lägg till övning"
    Och väljer övningen "Armhävningar"
    Så ska jag inte se valen för set och reps
    Och ska jag se knappen "Lägg till"
    Och ska jag inte se knappen "Klar"
    När jag trycker på "Lägg till"
    Så ska "push-up" ligga i kön utan klara set
    Och konsolen ska inte ha några fel
