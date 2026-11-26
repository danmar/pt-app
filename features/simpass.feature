# language: sv
Egenskap: Förslag på simpass
  Appen föreslår simpass med uppvärmning, teknik, huvuddel och nedvarvning.

  Abstrakt Scenario: Ett simpass på <minuter> minuter med fokus <fokus>
    När jag ber om ett simpass på <minuter> minuter i "<simsätt>" med fokus "<fokus>"
    Så ska passet börja med "Uppvärmning" och sluta med "Nedvarvning"
    Och passet ska vara ungefär <meter> meter
    Och nedvarvningen ska vara <nedvarvning> meter
    Och ingen del ska vara avbockad

    Exempel:
      | minuter | simsätt | fokus     | meter | nedvarvning |
      | 20      | crawl   | endurance | 600   | 100         |
      | 40      | breast  | speed     | 1200  | 200         |
      | 60      | mixed   | technique | 1800  | 200         |

  Scenario: Fartpass har en del med sprinter
    När jag ber om ett simpass på 40 minuter i "crawl" med fokus "speed"
    Så ska passet innehålla delen "Fart"
