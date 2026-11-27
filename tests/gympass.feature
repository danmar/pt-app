# language: sv
@ui @gym
Egenskap: Gympass
  Ett pågående gympass i appen. Varje scenario börjar på startsidan,
  trycker på Gym och sedan på Börja träna, så att ett nytt pass är igång.

  Bakgrund:
    Givet att jag öppnar appen med tom data
    När jag väljer "Gym" på startsidan
    Och trycker på "Börja träna"
    Så ska ett nytt gympass vara igång

  Scenario: Ett nytt pass föreslår uppvärmning och har en kö
    Så ska jag se knappen "Jag har redan värmt upp"
    Och ska jag se knappen "Lägg till övning"
    Och konsolen ska inte ha några fel

  Scenario: En övning som läggs till under passet visas utan set och reps
    När jag trycker på "Lägg till övning"
    Och väljer det första förslaget
    Så ska jag inte se valen för set och reps
    Och ska jag se knappen "Lägg till"
    Och ska jag inte se knappen "Klar"
    När jag trycker på "Lägg till"
    Så ska förslaget ligga i kön utan klara set
    Och konsolen ska inte ha några fel

  Scenario: En styrkeövning anges med set, reps och vikt en gång
    När jag lägger till "Bänkpress" från listan
    Och kör "Bänkpress" från kön
    Så ska fälten för set och reps finnas en gång
    Och ska övningen ha 4 set om 8 reps på 0 kg
    När jag trycker på "Fler set"
    Och trycker på "Färre reps"
    Och skriver vikten "42,5"
    Så ska övningen ha 5 set om 7 reps på 42,5 kg
    Och konsolen ska inte ha några fel

  Scenario: Set klart bockar av ett set i taget
    När jag lägger till "Bänkpress" från listan
    Och kör "Bänkpress" från kön
    Och trycker på "Set 1 av 4 klart"
    Och trycker på "Set 2 av 4 klart"
    Så ska 2 set vara klara
    När jag trycker på "Ångra senaste set"
    Så ska 1 set vara klara

  Scenario: En enbensövning anges för höger och vänster ben var för sig
    När jag kör "Benpress med ett ben" från kön
    Och trycker på "Fler reps" för höger ben
    Och skriver vikten "25" för vänster ben
    Och trycker på "Färre set" för vänster ben
    Så ska övningen ha 3 set om 9 reps på 0 kg för höger ben
    Och ska övningen ha 2 set om 8 reps på 25 kg för vänster ben
    När jag trycker på "Set 1 av 3 klart"
    Så ska 1 set vara klara för varje ben
    Och konsolen ska inte ha några fel
