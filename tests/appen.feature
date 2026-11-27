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
      | Logg          | Logg          |
      | Grafer        | Grafer        |
      | Inställningar | Inställningar |

  Scenario: Flikraden har fyra flikar
    Givet att jag öppnar appen med tom data
    Så ska flikraden ha flikarna "Idag, Logg, Grafer, Inställningar"

  Scenario: Startsidan visar blocken i ordningen i specen
    Givet att jag öppnar appen med tom data
    Så ska rubriken komma före valen och valen före stegkortet
    Och ska jag inte se texten "Uppvärmning, knäna och när du ska stoppa"

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
