import Foundation

enum ExerciseLibrary {
    static let byID: [String: Exercise] = Dictionary(uniqueKeysWithValues: all.map { ($0.id, $0) })

    static let all: [Exercise] = [
        // MARK: Ben
        Exercise(
            id: "squat", name: "Knäböj", muscles: [.legs, .core], equipment: .none,
            sets: 3, repsText: "12–15", defaultReps: 12, animation: .squat,
            tips: [
                "Stå med fötterna axelbrett isär och tårna lätt utåt.",
                "Skjut bak höften som om du ska sätta dig på en stol.",
                "Håll bröstet uppe och knäna i linje med tårna.",
                "Gå ner tills låren är parallella med golvet och tryck upp genom hälarna."
            ]),
        Exercise(
            id: "goblet-squat", name: "Gobletknäböj", muscles: [.legs, .core], equipment: .dumbbells,
            sets: 3, repsText: "10–12", defaultReps: 10, animation: .gobletSquat, props: [.dumbbells],
            tips: [
                "Håll en hantel lodrätt mot bröstet med båda händerna.",
                "Sitt ner mellan hälarna med rak rygg.",
                "Armbågarna pekar nedåt och kan nudda knäna i bottenläget.",
                "Pressa upp kontrollerat."
            ]),
        Exercise(
            id: "barbell-squat", name: "Knäböj med skivstång", muscles: [.legs, .core], equipment: .gym,
            sets: 4, repsText: "6–10", defaultReps: 8, animation: .barbellSquat, props: [.barbell],
            tips: [
                "Lägg stången på övre delen av ryggen, inte på nacken.",
                "Andas in och spänn magen innan du går ner.",
                "Knäna följer tårnas riktning.",
                "Börja med lätt vikt och fokusera på tekniken."
            ]),
        Exercise(
            id: "lunge", name: "Utfallssteg", muscles: [.legs], equipment: .none,
            sets: 3, repsText: "10 per ben", defaultReps: 10, animation: .lunge,
            tips: [
                "Ta ett långt steg framåt.",
                "Sänk bakre knät mot golvet tills båda knäna är i ca 90 grader.",
                "Håll överkroppen upprätt.",
                "Tryck ifrån med det främre benet och byt ben."
            ]),
        Exercise(
            id: "db-lunge", name: "Utfall med hantlar", muscles: [.legs], equipment: .dumbbells,
            sets: 3, repsText: "8–10 per ben", defaultReps: 8, animation: .lunge, props: [.dumbbells],
            tips: [
                "Håll en hantel i varje hand med raka armar.",
                "Kliv fram och sänk bakre knät mot golvet.",
                "Främre knät ska vara ovanför foten, inte framför tårna.",
                "Växla ben varje repetition eller kör alla på ett ben först."
            ]),
        Exercise(
            id: "glute-bridge", name: "Höftlyft", muscles: [.legs, .core], equipment: .none,
            sets: 3, repsText: "15", defaultReps: 15, animation: .gluteBridge,
            tips: [
                "Ligg på rygg med böjda knän och fötterna i golvet.",
                "Spänn rumpan och lyft höften tills kroppen är rak från knä till axel.",
                "Håll uppe en sekund.",
                "Sänk långsamt."
            ]),
        Exercise(
            id: "rdl", name: "Rumänska marklyft", muscles: [.legs, .back], equipment: .dumbbells,
            sets: 3, repsText: "10–12", defaultReps: 10, animation: .deadlift, props: [.dumbbells],
            tips: [
                "Stå med lätt böjda knän och hantlarna framför låren.",
                "Fäll framåt från höften och för hantlarna nära benen.",
                "Håll ryggen rak – känn sträckningen på baksida lår.",
                "Res dig genom att skjuta fram höften."
            ]),

        // MARK: Rygg
        Exercise(
            id: "deadlift", name: "Marklyft", muscles: [.back, .legs], equipment: .gym,
            sets: 3, repsText: "5–8", defaultReps: 6, animation: .deadlift, props: [.barbell],
            tips: [
                "Stå med mitten av foten under stången.",
                "Greppa stången, sänk höften och håll ryggen rak.",
                "Lyft genom att trycka golvet ifrån dig – stången nära kroppen.",
                "Stå upprätt utan att svanka, sänk sedan kontrollerat."
            ]),
        Exercise(
            id: "db-row", name: "Hantelrodd", muscles: [.back, .arms], equipment: .dumbbells,
            sets: 3, repsText: "10–12", defaultReps: 10, animation: .row, props: [.dumbbells],
            tips: [
                "Fäll fram överkroppen med rak rygg och lätt böjda knän.",
                "Dra hantlarna mot höften.",
                "Kläm ihop skulderbladen i toppläget.",
                "Sänk långsamt."
            ]),
        Exercise(
            id: "barbell-row", name: "Skivstångsrodd", muscles: [.back, .arms], equipment: .gym,
            sets: 4, repsText: "8–10", defaultReps: 8, animation: .row, props: [.barbell],
            tips: [
                "Fäll fram ca 45 grader med rak rygg.",
                "Dra stången mot naveln.",
                "Armbågarna nära kroppen.",
                "Undvik att gunga med överkroppen."
            ]),
        Exercise(
            id: "pull-up", name: "Chins", muscles: [.back, .arms], equipment: .gym,
            sets: 3, repsText: "5–10", defaultReps: 6, animation: .pullUp, props: [.pullUpBar],
            tips: [
                "Häng i stången med raka armar.",
                "Dra dig upp tills hakan är över stången.",
                "Sänk dig kontrollerat hela vägen ner.",
                "För tungt? Använd assisterad chinsmaskin eller ett gummiband."
            ]),
        Exercise(
            id: "superman", name: "Superman", muscles: [.back, .core], equipment: .none,
            sets: 3, repsText: "12", defaultReps: 12, animation: .superman,
            tips: [
                "Ligg på mage med armarna sträckta framåt.",
                "Lyft armar, bröst och ben samtidigt från golvet.",
                "Håll två sekunder och titta ner i golvet.",
                "Sänk långsamt."
            ]),

        // MARK: Bröst
        Exercise(
            id: "bench-press", name: "Bänkpress", muscles: [.chest, .arms, .shoulders], equipment: .gym,
            sets: 4, repsText: "6–10", defaultReps: 8, animation: .benchPress, props: [.bench, .barbell],
            tips: [
                "Ligg med ögonen under stången och fötterna i golvet.",
                "Greppa lite bredare än axelbrett.",
                "Sänk stången mot nedre delen av bröstet.",
                "Pressa upp. Använd gärna en spotter vid tunga vikter."
            ]),
        Exercise(
            id: "db-bench", name: "Hantelpress på bänk", muscles: [.chest, .arms], equipment: .gym,
            sets: 3, repsText: "8–12", defaultReps: 10, animation: .benchPress, props: [.bench, .dumbbells],
            tips: [
                "Ligg på bänken med en hantel i varje hand.",
                "Sänk hantlarna till bröstets sidor.",
                "Pressa upp och för ihop hantlarna lätt i toppen.",
                "Håll skulderbladen ihop mot bänken."
            ]),
        Exercise(
            id: "push-up", name: "Armhävningar", muscles: [.chest, .arms, .core], equipment: .none,
            sets: 3, repsText: "8–15", defaultReps: 10, animation: .pushUp,
            tips: [
                "Händerna lite bredare än axlarna.",
                "Kroppen ska vara rak som en planka från huvud till häl.",
                "Sänk bröstet mot golvet med armbågarna snett bakåt.",
                "För tungt? Gör dem på knä eller mot en bänk."
            ]),

        // MARK: Axlar & armar
        Exercise(
            id: "shoulder-press", name: "Axelpress med hantlar", muscles: [.shoulders, .arms], equipment: .dumbbells,
            sets: 3, repsText: "8–12", defaultReps: 10, animation: .shoulderPress, props: [.dumbbells],
            tips: [
                "Håll hantlarna i axelhöjd.",
                "Spänn magen så att du inte svankar.",
                "Pressa rakt upp tills armarna är nästan raka.",
                "Sänk kontrollerat."
            ]),
        Exercise(
            id: "bicep-curl", name: "Bicepscurl", muscles: [.arms], equipment: .dumbbells,
            sets: 3, repsText: "10–12", defaultReps: 10, animation: .bicepCurl, props: [.dumbbells],
            tips: [
                "Armbågarna stilla intill kroppen.",
                "Böj armarna och lyft hantlarna mot axlarna.",
                "Undvik att gunga med ryggen.",
                "Sänk långsamt hela vägen."
            ]),
        Exercise(
            id: "triceps-ext", name: "Tricepspress över huvudet", muscles: [.arms], equipment: .dumbbells,
            sets: 3, repsText: "10–12", defaultReps: 10, animation: .tricepsExtension, props: [.dumbbells],
            tips: [
                "Håll hanteln med båda händerna ovanför huvudet.",
                "Sänk hanteln bakom huvudet genom att böja armbågarna.",
                "Överarmarna ska peka rakt upp och vara stilla.",
                "Sträck upp igen."
            ]),

        // MARK: Mage & bål
        Exercise(
            id: "plank", name: "Plankan", muscles: [.core], equipment: .none,
            sets: 3, repsText: "30–45 s", defaultReps: 30, animation: .plank, isTimed: true,
            tips: [
                "Stöd på underarmarna med armbågarna under axlarna.",
                "Kroppen rak – varken rumpa upp eller svank.",
                "Spänn mage och rumpa.",
                "Andas lugnt under hela tiden."
            ]),
        Exercise(
            id: "crunch", name: "Crunches", muscles: [.core], equipment: .none,
            sets: 3, repsText: "15–20", defaultReps: 15, animation: .crunch,
            tips: [
                "Ligg på rygg med böjda knän.",
                "Händerna lätt vid huvudet – dra inte i nacken.",
                "Rulla upp axlarna från golvet med magmusklerna.",
                "Sänk långsamt."
            ]),

        // MARK: Kondition
        Exercise(
            id: "jumping-jack", name: "Jumping jacks", muscles: [.cardio], equipment: .none,
            sets: 3, repsText: "45 s", defaultReps: 45, animation: .jumpingJack, isTimed: true,
            tips: [
                "Hoppa ut med benen samtidigt som armarna går upp.",
                "Hoppa ihop och för ner armarna.",
                "Landa mjukt på framfoten.",
                "Bra uppvärmning!"
            ]),
        Exercise(
            id: "mountain-climber", name: "Mountain climbers", muscles: [.cardio, .core], equipment: .none,
            sets: 3, repsText: "30 s", defaultReps: 30, animation: .mountainClimber, isTimed: true,
            tips: [
                "Starta i armhävningsposition.",
                "Dra växelvis knäna mot bröstet i högt tempo.",
                "Håll höften låg och stilla.",
                "Händerna rakt under axlarna."
            ]),
    ]
}
