# language: sv
Egenskap: Omdöme efter passet
  Som hos en PT får jag ett positivt omdöme och ett tips efter passet.

  Scenario: Nytt personbästa
    Givet ett tidigare pass för 3 dagar sedan med "bench-press" 3 set om 8 reps på 50 kg
    Och dagens pass med "bench-press" 3 set om 8 reps på 55 kg
    När jag får omdömet
    Så ska rubriken vara "Starkt pass!"
    Och omdömet ska nämna "Nytt personbästa: 55 kg i bänkpress"

  Scenario: Tips om att öka vikten när alla set satt
    Givet dagens pass med "bench-press" 3 set om 10 reps på 50 kg
    När jag får omdömet
    Så ska tipset vara "Du klarade alla set i bänkpress med 50 kg. Prova 52,5 kg nästa gång."

  Scenario: Första gången en övning körs
    Givet dagens pass med "deadlift" 2 set om 5 reps på 60 kg
    När jag får omdömet
    Så ska omdömet nämna "Första gången du körde marklyft"

  Scenario: Press och drag i samma pass ger beröm för balans
    Givet dagens pass med "bench-press" 3 set om 8 reps på 50 kg
    Och dagens pass med "seated-row" 3 set om 10 reps på 40 kg
    När jag får omdömet
    Så ska omdömet nämna "Bra balans"
