# language: sv
@gym
Egenskap: Förslag på nästa övning under passet
  Under ett styrkepass föreslår appen nästa övning utifrån det jag redan kört idag.

  Bakgrund:
    Givet att jag har utrustningen "body, dumbbells, barbell, machine"

  Scenario: Förslagen spänner över flera muskelgrupper i början av passet
    När jag ber om förslag på nästa övning
    Så ska jag få 5 förslag
    Och förslagen ska täcka minst 3 muskelgrupper

  Scenario: En övning jag redan kört föreslås inte igen
    Givet att jag har kört "bench-press" med 3 set idag
    När jag ber om förslag på nästa övning
    Så ska "bench-press" inte finnas bland förslagen

  Scenario: Efter bänkpress föreslås drag som motvikt
    Givet att jag har kört "bench-press" med 3 set idag
    När jag ber om förslag på nästa övning
    Så ska något förslag ha skälet "Motvikt till bänkpress"

  Scenario: Övningar i kön föreslås inte
    Givet att "seated-row" ligger i kön
    När jag ber om förslag på nästa övning
    Så ska "seated-row" inte finnas bland förslagen

  Scenario: En upptagen maskin hamnar sist
    Givet att maskinen för "leg-press" är upptagen
    När jag ber om förslag på nästa övning
    Så ska "leg-press" vara sist och markerad som upptagen

  Scenario: Bara valda muskelgrupper föreslås
    Givet att jag har valt muskelgrupperna "back"
    När jag ber om förslag på nästa övning
    Så ska alla förslag ha huvudmuskeln "back"

  Scenario: Bara vald utrustning föreslås
    Givet att jag har utrustningen "body"
    När jag ber om förslag på nästa övning
    Så ska alla förslag använda utrustningen "body"

  Scenario: Ont i knäna tar bort knäböj ur förslagen
    Givet att jag har ont i "knees" på nivå 2
    Och att jag har valt muskelgrupperna "legs"
    När jag ber om förslag på nästa övning
    Så ska inget förslag belasta "knees"

  Scenario: En övning med mål lyfts fram
    Givet att jag har valt muskelgrupperna "chest"
    Och att jag har målet "60 kg i bänkpress" för "bench-press"
    När jag ber om förslag på nästa övning
    Så ska "bench-press" vara första förslaget
    Och första förslaget ska ha skälet "Mot ditt mål: 60 kg i bänkpress"
