# language: sv
Egenskap: Veckoförslag
  Under Planera föreslår appen de kommande sju dagarna.

  Scenario: Veckan har sju dagar och rätt antal träningsdagar
    Givet att jag vill träna 4 dagar i veckan med "gym, swim, walk"
    När jag ber om ett veckoförslag
    Så ska förslaget ha 7 dagar
    Och förslaget ska ha 4 träningsdagar
    Och förslaget ska ha minst 1 vilodag

  @gym
  Scenario: Styrkedagar läggs inte dag efter dag
    Givet att jag vill träna 3 dagar i veckan med "gym"
    När jag ber om ett veckoförslag
    Så ska inga två styrkedagar ligga i rad

  Scenario: Dagar jag själv har lagt in ligger fast
    Givet att jag vill träna 3 dagar i veckan med "gym, swim, walk"
    Och att jag har lagt in "rest" på dag 1
    Och att jag har lagt in "swim" på dag 2
    När jag ber om ett veckoförslag
    Så ska dag 1 vara "rest"
    Och dag 2 vara "swim"

  Scenario: Ont i knäna tar bort löpning när det finns annan kondition
    Givet att jag vill träna 5 dagar i veckan med "gym, run, bike"
    Och att jag har ont i "knees" på nivå 2
    När jag ber om ett veckoförslag
    Så ska ingen dag vara "run"

  Scenario: Det jag redan gjort idag syns som klart
    Givet att jag vill träna 3 dagar i veckan med "gym, swim"
    Och att jag har simmat idag
    När jag ber om ett veckoförslag
    Så ska dag 0 vara "swim" och markerad som klar
