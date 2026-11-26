# language: sv
Egenskap: Säkerhetskopia
  All data sparas i telefonen. Jag kan exportera och importera en säkerhetskopia.

  @gym
  Scenario: Export tar inte med ett pågående pass
    Givet en tom app
    Och att ett pass pågår
    När jag exporterar en säkerhetskopia
    Så ska kopian ha "app" satt till "minpt"
    Och kopian ska inte innehålla "active"

  Scenario: Import av en trasig fil ger tomma listor i stället för fel
    Givet en tom app
    När jag importerar en säkerhetskopia med innehållet:
      """
      { "sessions": "inte en lista", "walks": null, "steps": [1, 2], "week": ["gym"] }
      """
    Så ska "sessions" vara en tom lista
    Och "walks" vara en tom lista
    Och veckoplanen ska ha 7 tomma dagar

  Scenario: Export och import ger samma data tillbaka
    Givet en tom app
    Och att jag har gått 30 minuter
    När jag exporterar en säkerhetskopia
    Och raderar all data
    Och importerar kopian igen
    Så ska jag ha 1 promenad på 30 minuter
