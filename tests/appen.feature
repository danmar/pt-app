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

  Scenario: Gym-sidan går att öppna från startsidan
    Givet att jag öppnar appen med tom data
    När jag väljer "Gym" på startsidan
    Så ska jag se knappen "Börja träna"
    Och konsolen ska inte ha några fel
