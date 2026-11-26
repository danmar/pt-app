# language: sv
Egenskap: Övningar anpassas efter ont
  För att inte göra ont värre
  vill jag att appen hoppar över övningar som belastar stället där jag har ont.
  Lite ont tar bort tung belastning, ont tar bort all belastning.

  Abstrakt Scenario: <övning> när knäna har nivå <nivå>
    Givet att jag har ont i "knees" på nivå <nivå>
    Så ska övningen "<övning>" vara <tillåten>

    Exempel:
      | övning             | nivå | tillåten   |
      | squat              | 0    | tillåten   |
      | squat              | 1    | bortvald   |
      | squat              | 2    | bortvald   |
      | leg-extension      | 1    | tillåten   |
      | leg-extension      | 2    | bortvald   |
      | straight-leg-raise | 2    | tillåten   |
      | push-up            | 2    | tillåten   |

  Scenario: Lite ont i axlarna tar bort bänkpress men inte armhävningar
    Givet att jag har ont i "shoulders" på nivå 1
    Så ska övningen "bench-press" vara bortvald
    Och övningen "push-up" vara tillåten

  Scenario: Fysioövningar tas aldrig bort
    Givet att jag har ont i "knees" på nivå 2
    Och att jag har ont i "back" på nivå 2
    Och att jag har ont i "shoulders" på nivå 2
    Så ska alla fysioövningar vara tillåtna

  Scenario: Hemma utan hantlar föreslås inga hantelövningar
    Givet att jag tränar hemma
    Och att jag inte har hantlar
    Så ska ingen tillgänglig övning kräva hantlar
    Men övningen "push-up" vara tillgänglig
