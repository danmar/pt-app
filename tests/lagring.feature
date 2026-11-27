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

  Scenario: Export och import ger samma data tillbaka
    Givet en tom app
    Och att jag har gått 30 minuter
    När jag exporterar en säkerhetskopia
    Och raderar all data
    Och importerar kopian igen
    Så ska jag ha 1 promenad på 30 minuter

  Scenario: En ny app har fysioövningarna som favoriter
    Givet en tom app
    Så ska favoriterna på gym vara "single-leg-extension, single-leg-curl, single-leg-press"
    Och favoriterna hemma vara "single-leg-mini-squat, wall-sit-high"

  Scenario: Övningarna i de gamla fysiopassen blir favoriter
    Givet en tom app
    När jag importerar en säkerhetskopia med innehållet:
      """
      { "saved": [{ "id": "fysio-gym", "place": "gym", "items": [{ "exId": "leg-press" }, { "exId": "single-leg-curl" }] }],
        "week": ["gym", "", "", "", "", "", ""], "goals": [{ "exId": "bench-press" }],
        "settings": { "physioAlways": true, "priority": "strength", "weekDays": 3 } }
      """
    Så ska favoriterna på gym vara "leg-press, single-leg-curl"
    Och favoriterna hemma vara "single-leg-mini-squat, wall-sit-high"
    Och datan ska inte innehålla "saved", "week" eller "goals"
    Och inställningarna ska inte innehålla "physioAlways", "priority" eller "weekDays"
