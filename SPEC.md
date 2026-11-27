# Specifikation: Min PT


## 1. Syfte

Min PT är en personlig tränare och fysioterapeut i mobilen. Appen föreslår styrkepass, konditionspass och simpass, visar hur övningarna görs, loggar träningen och ger omdöme efter varje pass. Den tar hänsyn till ont i axlar, rygg och knän och till vilken utrustning som finns.

Målgrupp: en motionär som tränar på gym, hemma, simmar och går, och som vill ha förslag i stället för fasta program.

## 2. Plattform och tekniska krav

| Krav | Beskrivning |
|---|---|
| T1 | Appen är en PWA av vanlig HTML, CSS och JavaScript (ES-moduler) utan byggsteg. Källkoden ligger i `web/`. |
| T2 | Appen ska gå att lägga på hemskärmen i Safari på iPhone och öppnas då i helskärm (`display: standalone`, stående läge). |
| T3 | Appen ska fungera helt offline. En service worker (`web/sw.js`) cachar alla filer. Cachens namn är `VERSION` och höjs vid varje ändring. |
| T4 | All data sparas lokalt i `localStorage` under nyckeln `minpt-data-v1`. Ingen data skickas till någon server. Appen ber om beständig lagring (`navigator.storage.persist`). |
| T5 | Appen ska starta utan fel i konsolen. |
| T6 | Allt gränssnitt är på svenska. Tal formateras med `sv-SE` (t.ex. `42,5`, `9 500`). |
| T7 | Appen publiceras på GitHub Pages från `web/` vid push till `main`. |
| T8 | Om lagringen inte går att skriva (privat läge, fullt) ska appen fortsätta fungera under sessionen. |

## 3. Navigation

Appen har en flikrad längst ner med fyra flikar:

| Flik | Innehåll |
|---|---|
| Idag | Startsida: val av aktivitet, steg, fysio |
| Logg | Siffror, diagram för senaste 7 dagarna, logga i efterhand, historik |
| Grafer | Minuter per vecka, set per muskelgrupp, utveckling per övning, steg |
| Inställningar | Ont, utrustning hemma, vila, stegmål, färgtema, installera, data |

Undervyer (Gym, Hemma, Kondition, Simma, Fysio) öppnas från startsidan och har en tillbaka-knapp. Detaljer, listor och formulär öppnas i ett bottenark.

### 3.1 Block på varje sida

Varje sida består av block. Vilka block som visas och i vilken ordning står i tabellen nedan och är hårdkodat i appen. Blocken visas uppifrån och ned i den ordning de står.

| Sida | Block |
|---|---|
| Idag | `rubrik`, `val`, `steg`, `fysio` |
| Logg | `rubrik`, `siffror`, `diagram`, `logga`, `historik` |
| Grafer | `rubrik`, `siffror`, `minuter-per-vecka`, `set-per-muskelgrupp`, `övningar`, `steg` |
| Inställningar | `rubrik`, `inställningar`, `färgtema`, `installera`, `data` |
| Köra en övning | `rubrik`, `logga`, `figur`, `muskler`, `knappar`, `så-gör-du`, `tänk-på` |
| Lägga till en övning | `figur`, `muskler` |

## 4. Begrepp

| Begrepp | Betydelse |
|---|---|
| Muskelgrupp | `cardio` (Kondition), `legs` (Ben & rumpa), `back` (Rygg), `chest` (Bröst), `shoulders` (Axlar), `arms` (Armar), `core` (Mage & bål). Ordningen styr hur övningar sorteras i ett pass. |
| Huvudmuskel | Första muskelgruppen i en övnings lista. Övriga är hjälpmuskler. |
| Utrustning (gear) | `body` (Kroppsvikt), `dumbbells`, `kettlebell`, `barbell`, `machine` (Maskiner & kabel), `ball` (Gymboll), `band` (Gummiband), `board` (Balansplatta). |
| Plats | `gym` eller `home`. På gym finns all utrustning, hemma bara kroppsvikt och det man markerat i Inställningar. |
| Belastning (load) | Per övning och kroppsdel (`knees`, `back`, `shoulders`): 0 = ingen, 1 = lätt, 2 = tung. |
| Ont | Per kroppsdel: 0 = Inget, 1 = Lite ont (högst 3 av 10), 2 = Ont (mer än 3 av 10, eller värre av träning). |
| Rörelsemönster | T.ex. `push-h` (horisontell press), `pull-v` (vertikalt drag), `squat`, `hinge`. Används för variation och motvikt. |
| Basövning | Övning med mönster `squat`, `lunge`, `hinge`, `hip`, `pull-h`, `pull-v`, `push-h` eller `push-v`. Övriga är isolering. |
| Fysioövning | Övning från fysioterapeut (`physio: true`). Tas aldrig bort på grund av ont. |
| Enbensövning | Övning som görs ett ben i taget (`unilateral`). Varje set får H (höger) eller V (vänster). |

## 5. Funktioner

### 5.1 Startsidan (Idag)

- F1.1 Rubriken är "Vad vill du göra idag?".
- F1.2 Val: Gym, Hemma och Kondition.
- F1.5 Stegkort: dagens steg mot stegmålet och de senaste 7 dagarna. "Lägg in" öppnar ett fält "Antal steg" och "Spara" sparar värdet för dagens datum.
- F1.6 Fysiokort: sammanfattning av ont och länk till Fysio.
- F1.7 Guiden Träna säkert öppnas från en övnings detaljer ("Läs mer om att träna säkert").

### 5.2 Styrkepass (gym och hemma)

Det finns inga färdiga program. Användaren väljer utrustning och muskelgrupper, och appen föreslår övning för övning.

**Starta**
- F2.1 "Börja träna" startar ett nytt pass. Passet sparas i `data.active` så att det överlever om appen stängs, och återupptas nästa gång appen öppnas.
- F2.2 Passet börjar med förslag på uppvärmning: roddmaskin, cykel eller marsch på gym; marsch, skuggboxning eller jumping jacks hemma. Skonsamma alternativ kommer först om knäna gör ont. "Jag har redan värmt upp" hoppar över uppvärmningen. Styrkeövningarna visas under rubriken "Sedan".
- F2.3 Gym- och hemmapass börjar med platsens favoritövningar i kön (se 5.6).
- F2.4 Under passet öppnas ingen övning automatiskt. Användaren trycker på den övning som ska köras, i kön eller bland förslagen.

**Kö**
- F2.5 Användaren kan lägga övningar i en kö och flytta om dem.

**Lägg till övning**
- F2.6.1 Knappen "Lägg till övning" i passet öppnar sidan "Lägg till övning". Knappen "Passet" leder tillbaka.
- F2.6.2 Överst står hjälptexten "Tryck på en övning för att läsa om den och lägga till den, eller på + för att lägga den direkt i kön."
- F2.6.3 Under hjälptexten väljer användaren typ av övning: Styrka, Cirkel, HIIT, Kondition, Balans eller Stretch.
- F2.6.4 Under typen väljer användaren muskelgrupper. Inget valt betyder alla. Valet visas inte för Kondition.
- F2.6.5 Under muskelgrupperna väljer användaren vilken utrustning som ska användas. Valet visas inte för Stretch.
- F2.6.6 Under det visas en lista med automatiska förslag som kompletterar de övningar som redan finns i passet (se 6.2). Varje förslag har knapparna "Om övningen" och + (lägg i kön).
- F2.6.7 Har användaren ont visas "Fysio för <kroppsdel>" med rehabövningar under förslagen (se F7.3).
- F2.6.8 Under förslagen finns knappen "Välj övningar från listan".
- F2.7 Alla övningar kan väljas ur en lista med bockar. Sökningen träffar namn och andra namn (t.ex. *liggande hantelpress*, *rodd*, *benspark*).
- F2.9 Under "Valfri övning…" kan egna övningar väljas.
- F2.6.9 Under det visas "Kört idag" om något är kört idag.
- F2.6.10 Sist visas "Musklerna i passet". Kroppskartan visar musklerna i de övningar som har klara set. Användaren kan växla mellan "Det här passet" och "Förra passet".
- F2.6.11 Ett tryck på en muskel i "Musklerna i passet" visar förslag på övningar som tränar den muskeln.

**Lägg till övning: övning**
- F2.6.12 Ett tryck på en övning visar övningsvyn för att lägga till övningen (se F2.23). Där finns inga val för set och reps, och knappen längst ned heter "Lägg till" (inte "Klar").
- F2.6.13 "Lägg till" lägger övningen i kön utan klara set och går tillbaka till passet.

**Logga en övning**
- F2.10 En styrkeövning anges med set, reps och vikt en gång för hela övningen, med knapparna "Fler set", "Färre set", "Fler reps", "Färre reps" och ett viktfält. Standardvärden kommer från övningen (t.ex. bänkpress 4 set × 8 reps). Vikten fylls i från senaste gången övningen kördes, annars 0 kg.
- F2.11 "Set N av M klart" bockar av ett set i taget. "Ångra senaste set" tar bort det senaste.
- F2.12 En enbensövning har egna värden för set, reps och vikt för höger och vänster ben. "Set N av M klart" bockar av ett set för varje ben.
- F2.13 Efter ett klart set startar en vilotimer (standard 90 s, ändras i steg om 15 s). Den piper när vilan är slut.
- F2.14 Skärmen hålls tänd under passet (Wake Lock).
- F2.15 Användaren kan svepa mellan övningarna.
- F2.16 "Gör det ont?" mitt i en övning låter användaren ange var det gör ont och välja en annan övning.

**Övningsvyn**

Övningsvyn visas på två sätt: när användaren *kör* en övning (trycker på den i kön, bland uppvärmningen eller bland de slutförda) och när användaren *lägger till* en övning (trycker på den under "Lägg till övning"). Tabellen visar vad som syns uppifrån och ned.

| Del | Köra | Lägga till |
|---|---|---|
| Överst | "Övning N" eller "Uppvärmning" och tiden sedan passet började | Övningens namn, ingen tid |
| Övningens namn | Ja | Nej (står redan överst) |
| Raden "4 set × 8 · muskler" | Ja | Nej |
| Loggning (set, reps, vikt eller tid) | Ja | Nej |
| Streckgubben | Ja | Ja |
| Kroppskartan, hälften så stor | Ja | Ja |
| Texten "Tryck på en muskel för att få förslag på övningar." | Nej | Nej |
| Knapparna Uppvärmning och Gör det ont? | Ja | Nej |
| Så gör du | Ja | Nej |
| Tänk på | Ja | Nej |
| Knapparna längst ned | Avbryt och Klar | Avbryt och Lägg till |

- F2.22 När en övning körs visas uppifrån: "Övning N" (eller "Uppvärmning") och tiden, övningens namn och raden med set, reps och muskler, loggningen, streckgubben, kroppskartan, knapparna Uppvärmning och Gör det ont?, "Så gör du" och "Tänk på". Längst ned finns Avbryt och Klar.
- F2.23 När en övning läggs till visas uppifrån: övningens namn utan tid, streckgubben och kroppskartan. Längst ned finns Avbryt och Lägg till.
- F2.24 Kroppskartan i övningsvyn är hälften så stor som på andra ställen. Det går inte att trycka på musklerna i den, och texten "Tryck på en muskel för att få förslag på övningar." visas inte. Musklerna går att trycka på i "Musklerna i passet" (F2.6.11).
- F2.25 Övningar som mäts i minuter (roddmaskin och motionscykel) har ingen knapp "+ Lägg till set". Övningar som mäts i sekunder (t.ex. planka) har kvar knappen.

**Uppvärmning**
- F2.17 Varje övning kan markeras som uppvärmning. Roddmaskin och motionscykel blir uppvärmning automatiskt om de körs först.
- F2.18 Uppvärmning visas för sig, räknas inte som set för muskelgrupperna och ger ingen vilotimer.
- F2.19 Roddmaskinen loggas med tid och meter, utan vikt.

**Avsluta**
- F2.20 Efter gympass föreslås stretch: 5 av 7 stretchövningar, valda efter vilka muskler passet tränat, i ordning från stående till golvet. 30 s per sida, 10 s mellan.
- F2.21 När passet sparas visas ett omdöme (se 6.4).

### 5.3 Passtyper med intervalltimer

| Typ | Arbete | Vila | Vila mellan varv | Beskrivning |
|---|---|---|---|---|
| Cirkel | 40 s | 15 s | 60 s | Stationer där muskelgrupperna växlar |
| HIIT | 30 s | 20 s | 60 s | Korta intensiva intervaller |
| Kondition | 90 s | 30 s | 30 s | Längre intervaller i jämnt tempo |
| Balans | 40 s | 15 s | 45 s | Övningar på ett ben och smal bas |

- F3.1 Passlängder: gym 20, 40 eller 60 min, hemma 10, 15 eller 20 min.
- F3.2 Timern räknar ner, piper vid varje nytt arbetssteg och går vidare själv.
- F3.3 Cirkel- och HIIT-pass börjar med uppvärmning.
- F3.4 Intervallpass loggas med minuter. Styrkepass loggas utan tid.

### 5.4 Kondition

- F4.1 Aktiviteter: Simning, Löpning, Cykling, Promenad, Längdskidor och Annat (med eget namn).
- F4.2 Löpning, cykling, skidor och annat får ett passförslag på 20–60 min med fokus Lugnt, Intervaller eller Nybörjare (växla med gång). Delarna bockas av och passet sparas med tid och km.
- F4.3 Passförslaget består av uppvärmning (20 % av tiden, 5–10 min), huvuddel och nedvarvning (12 %, 3–10 min).
- F4.4 Intervaller: 4 min arbete / 3 min vila om huvuddelen är minst 28 min, 3/2 om minst 16 min, annars 1/1.
- F4.5 Om knäna har ont på nivå 2 blir löpning gång-jogg (2 + 2 min) och intervaller tas bort.
- F4.6 Fysioterapeuten ger råd för aktiviteten när något gör ont (t.ex. sadelhöjd vid ont i knäna).
- F4.7 Promenader loggas för hand med minuter och km.

### 5.5 Simma

- F5.1 Simpass på 20, 40 eller 60 min i Blandat, Crawl, Bröstsim eller Ryggsim, med fokus Uthållighet, Fart eller Teknik.
- F5.2 Passet räknas för 25-metersbassäng med cirka 30 m per minut inklusive vila.
- F5.3 Delar i ordning: Uppvärmning (20 %, avrundat till 50 m), Teknik (4 × 50 m, eller 6 × 50 m från 40 min), huvuddel, Nedvarvning (100 m, eller 200 m från 40 min).
- F5.4 Fart ger delen "Fart" (4–12 × 50 m) och vid behov "Tempo" (100 m-intervaller).
- F5.5 Ingen del är avbockad från början. Delarna bockas av och passet sparas.
- F5.6 Ett simpass kan också loggas direkt med minuter, meter och simsätt.

| Minuter | Totalt | Nedvarvning |
|---|---|---|
| 20 | cirka 600 m | 100 m |
| 40 | cirka 1 200 m | 200 m |
| 60 | cirka 1 800 m | 200 m |

### 5.6 Favoriter

- F6.1 Användaren kan markera en övning som favorit. Gym och hemma har var sina favoriter.
- F6.2 Favoriten markeras med en stjärna i övningens detaljer ("Om övningen") och i övningsvyn när övningen körs. Stjärnan gäller platsen för passet eller vyn, och texten är "Favorit på gym" eller "Favorit hemma". Visas detaljerna utanför Gym, Hemma och passet (t.ex. i Logg eller Grafer) finns en stjärna för varje plats.
- F6.3 När ett gym- eller hemmapass startar läggs platsens favoriter i kön, i den ordning de markerades. De kan tas bort ur kön som andra övningar.
- F6.4 Från början är benspark, bencurl och benpress med ett ben favoriter på gym, och kort enbensknäböj och högt väggsittande favoriter hemma.

### 5.7 Fysio

- F7.1 Användaren anger ont i axlar, rygg och knän på nivå Inget, Lite ont eller Ont.
- F7.2 Förslagen hoppar över övningar som belastar stället (se 6.1).
- F7.3 Under passet föreslås rehabövningar för stället:

| Kroppsdel | Rehabövningar (i ordning) |
|---|---|
| Knän | raka benlyft, höftlyft, sidolyft, tåhävningar, cykel |
| Rygg | fågelhunden, höftlyft, plankan |
| Axlar | utåtrotation, väggänglar, sittande rodd |

- F7.4 För varje kroppsdel visas vad som tas bort, råd och när man ska söka vård (inklusive när man ska ringa 112).
- F7.5 Appen ska tydligt säga att råden är allmänna och inte ersätter en riktig fysioterapeut.

### 5.8 Övningar

- F8.1 Biblioteket har 84 övningar, varav 5 fysioövningar, 7 stretchövningar och 7 konditionsövningar.
- F8.2 Varje övning har namn, muskelgrupper, utrustning, standard för set och reps, instruktion och en animerad streckgubbe (SVG).
- F8.3 Varje övning har en lista "Tänk på" med vanliga misstag och hur man skyddar knän, rygg och axlar.
- F8.4 Varje styrkeövning visar en kroppskarta framifrån och bakifrån där huvudmuskler och hjälpmuskler är markerade.
- F8.5 Under passet visar kroppskartan vilka muskler som tränats i passet och förra passet.
- F8.6 Egna övningar skapas med namn, muskelgrupper, utrustning och om de är tidsatta eller enbensövningar. De föreslås inte automatiskt.

### 5.9 Logg

- F9.1 Historik över pass, simpass, konditionspass och promenader, med diagram över aktiva minuter de senaste 7 dagarna.
- F9.2 "Logga övningar" loggar ett pass i efterhand: datum, plats, tid och valfria övningar med set, reps och kg. Finns övningen inte skapas en egen.
- F9.3 Ett pass i loggen kan ändras via "Ändra passet".
- F9.4 Ett pass i loggen visar omdömet och kroppskartan.

### 5.10 Grafer

- F10.1 Aktiva minuter per vecka (träning, kondition, promenad), per ISO-vecka.
- F10.2 Set per muskelgrupp.
- F10.3 Utveckling per övning (vikt eller reps över tid).
- F10.4 Steg per dag de senaste 30 dagarna med en linje för stegmålet.
- F10.5 Tryck på ett diagram visar värden. Varje diagram kan visas som tabell.

### 5.11 Inställningar

| Inställning | Standard |
|---|---|
| Ont i axlar, rygg eller knän | Inget |
| Hantlar, kettlebell, balansplatta, gymboll, gummiband hemma | Av |
| Vila mellan set | 90 s (steg om 15 s) |
| Stegmål per dag | 8 000 (steg om 1 000) |
| Ljust/mörkt läge | Som telefonen (alternativ: Ljust, Mörkt) |
| Färg | Lila (alternativ: Blå, Grön, Rosa, Orange) |

- F11.1 Instruktion för att installera på hemskärmen visas när appen inte körs som installerad app.
- F11.2 Export av säkerhetskopia (JSON), import och radera all data.

## 6. Regler

### 6.1 Ont och belastning

En övning är tillåten om varje kroppsdel där den har belastning uppfyller:

| Ont | Tillåten belastning |
|---|---|
| 0 Inget | all |
| 1 Lite ont | under 2 (ingen tung) |
| 2 Ont | under 1 (ingen alls) |

- Fysioövningar är alltid tillåtna.
- Knäböj, utfall och andra knätunga övningar har tung belastning på knäna.

Exempel som ska gälla:

| Övning | Knän 0 | Knän 1 | Knän 2 |
|---|---|---|---|
| Knäböj | tillåten | bortvald | bortvald |
| Benspark | tillåten | tillåten | bortvald |
| Raka benlyft | tillåten | tillåten | tillåten |
| Armhävningar | tillåten | tillåten | tillåten |

Lite ont i axlarna tar bort bänkpress men inte armhävningar.

Hemma är bara övningar utan utrustning tillgängliga, plus de som kräver utrustning användaren har markerat.

### 6.2 Nästa övning under passet

Indata: övningar klara idag (med antal set), valda muskelgrupper (tom = alla utom kondition), vald utrustning, ont och kön.

Urval:
- Bara övningar med vald utrustning, tillåtna enligt 6.1, med huvudmuskel bland de valda.
- Inte övningar som redan körts idag eller ligger i kön.
- Fysioövningar och övningar som inte föreslås automatiskt räknas inte.

Poäng (högre är bättre):

| Villkor | Poäng | Skäl som visas |
|---|---|---|
| Skillnad mot mest tränade gruppen | 0,6 per set | |
| Muskelgruppen inte körd idag | +3 | "<Grupp> har du inte kört idag" |
| Hjälpmuskel inte körd idag | +0,5 per muskel | |
| Rörelsemönstret redan kört | −2,5 | |
| Nytt mönster för en körd grupp | | "Ny vinkel för <grupp>" |
| Motsatt mönster till förra övningen | +2 | "Motvikt till <övning>" |
| Samma huvudmuskel som förra övningen | −1,5 | |
| Basövning bland de två första | +1,5 | "Basövning, bra tidigt i passet" |
| Isolering från fjärde övningen | +1 | "Isolering, passar mot slutet" |
| Dagar sedan gruppen tränades (max 7), om inga grupper valts | +0,2 per dag | |

Skälet med högst vikt visas. Annars visas "Komplement för <grupp>".

Motsatta mönster: horisontell press ↔ horisontellt drag, vertikal press ↔ vertikalt drag, biceps ↔ triceps, benspark ↔ bencurl, knäböj ↔ höftfällning, crunch ↔ ryggresning.

Resultat:
- 5 förslag, högst två per muskelgrupp om flera grupper är valda.
- I början av passet ska förslagen täcka minst 3 muskelgrupper.

### 6.3 Förslag på pass (fast antal övningar)

- Antal övningar per passlängd: 10 min 3, 15–20 min 4, 40 min 6, 60 min 8.
- Muskelgrupper som vilat längst prioriteras (0–7 dagar). Högst 2 övningar per grupp, 1 för kondition.
- Hemma börjar passet med en pulshöjande övning.
- Övningarna sorteras efter muskelgruppens ordning.
- "Byt" ger en annan övning för samma huvudmuskel, annars en med överlappande muskler.

### 6.4 Omdöme efter passet

Omdömet har en rubrik, högst 4 höjdpunkter och ett tips. Uppvärmning räknas inte som arbete.

Höjdpunkter i prioritetsordning:

1. 🏅 Nytt personbästa (vikt, reps, sekunder eller distans) jämfört med alla tidigare pass, högst två övningar. Exempel: "Nytt personbästa: 55 kg i bänkpress!"
2. 📈 Mer jobb än förra gången (reps × vikt minst 4 % mer).
3. ✨ "Första gången du körde <övning>."
4. 🌡️ Bra uppvärmning, med tid och distans.
5. ⚖️ "Bra balans" om passet hade både press och drag.
6. 🩺 Fysioövningar gjorda, eller 🧠 "Smart träning" om man har ont men inte belastade stället tungt.
7. 🔥 Antal pass de senaste sju dagarna, från två.
8. 💪 Antal set och muskelgrupper, om det finns färre än två höjdpunkter.
9. 👏 Om inget annat: "Du dök upp och gjorde jobbet."

Rubrik: "Starkt pass!" vid personbästa, "Riktigt bra jobbat!" vid minst tre höjdpunkter, annars "Bra jobbat!".

Tips:
- Om alla set (minst två) nådde övningens standardreps med vikt och stället inte gör ont: "Du klarade alla set i <övning> med <x> kg. Prova <x + steg> kg nästa gång." Steg: 2,5 kg (stång, maskin), 1 kg (hantlar, armar och axlar), 2 eller 4 kg (kettlebell).
- Kroppsviktsövning där alla set satt: "Sikta på 1–2 reps till per set nästa gång."
- Annars, om något gör ont: "Känn efter i morgon …". Annars ett råd om vila.

Intervallpass, konditionspass, simpass och balanspass får ett kortare omdöme med minuter, km och antal pass på sju dagar.

## 7. Datamodell

Allt sparas som ett JSON-objekt:

```js
{
  sessions: [{ id, place, type?, date, endDate?, entries: [{ exId, warmup?, sets: [{ reps, weight, sec?, dist?, side? }] }] }],
  walks:    [{ id, date, minutes, km }],
  swims:    [{ id, date, minutes, meters, style }],
  cardio:   [{ id, date, kind: 'run' | 'bike' | 'ski' | 'other', minutes, km, name }],
  steps:    { 'ÅÅÅÅ-MM-DD': antal },
  favorites: { gym: [exId], home: [exId] },   // i den ordning de markerades
  customExercises: [{ id, name, muscles, gear, timed, unilateral? }],
  settings: { hasDumbbells, hasKettlebell, hasBoard, hasBall, hasBand, restSeconds, stepGoal,
              kneeFriendly, pain, painUpdated, gear, groups, themeMode, themeAccent },
  active:   null | { ... }   // pågående pass
}
```

Regler:
- D1 Vid inläsning normaliseras datan: fält med fel typ blir tomma listor eller standardvärden. Saknas `favorites` blir övningarna i de gamla sparade fysiopassen "Fysio gym" och "Fysio hemma" favoriter för gym och hemma, om de finns. Annars får användaren favoriterna i F6.4. Övriga gamla fält (`saved`, `week`, `goals` och inställningarna för planering) tas bort.
- D2 Export ger JSON med `app: "minpt"`, `version: 1` och `exportedAt`. Pågående pass (`active`) tas inte med.
- D3 Import av en trasig fil ger tomma listor i stället för fel.
- D4 Export följt av import ger samma data tillbaka.
- D5 Utrustning som kommit till senare läggs till en gång i ett sparat utrustningsval för gymmet.

## 8. Icke-funktionella krav

- N1 Gränssnittet ska fungera i mobilbredd i stående läge.
- N2 Ljust och mörkt läge, plus fem accentfärger. Statusfältets färg följer temat.
- N3 Knappar och diagram ska ha tillgängliga namn (`aria-label`, `role`), och diagram ska gå att visa som tabell.
- N4 Ljud (pip) via Web Audio. Saknas ljud fungerar appen ändå.
- N5 En ny version hämtas nästa gång appen öppnas och gäller gången därpå.

## 9. Test

Testerna är skrivna i Gherkin på svenska i `tests/` och körs med Cucumber, lokalt och i GitHub Actions vid varje push.

| Fil | Krav som testas |
|---|---|
| `appen.feature` | T5, kap. 3, 3.1, F1.5, 5.11 (mörkt läge) |
| `gympass.feature` | F2.1, F2.2, F2.6.12, F2.6.13, F2.10–F2.12, F2.22–F2.25 |
| `nästa-övning.feature` | 6.2 |
| `smärta.feature` | 6.1 |
| `simpass.feature` | F5.1–F5.5 |
| `omdöme.feature` | 6.4 |
| `lagring.feature` | D2–D4 |

Taggar: `@ui` öppnar appen i Chromium, `@gym` gäller gympass.

## 10. Avgränsningar

- Ingen inloggning, ingen server och ingen synkning mellan enheter.
- Ingen koppling till Hälsa-appen. Steg skrivs in för hand.
- Råden från fysioterapeuten är allmänna och ersätter inte vård.
- Appen ger inga kostråd utöver att kosten betyder mest för vikten.
