import Foundation

struct PlannedExercise: Identifiable, Hashable {
    let id = UUID()
    var exercise: Exercise
    var sets: Int
}

enum WorkoutLength: Int, CaseIterable, Identifiable {
    case short = 20, medium = 40, long = 60

    var id: Int { rawValue }
    var label: String { "\(rawValue) min" }
    var exerciseCount: Int {
        switch self {
        case .short: 4
        case .medium: 6
        case .long: 8
        }
    }
}

/// Föreslår pass. Prioriterar muskelgrupper du vilat längst, så att du får
/// en jämn fördelning över veckan utan att köra samma muskler två dagar i rad.
enum WorkoutPlanner {
    /// Dagar sedan varje muskelgrupp tränades (saknas = aldrig).
    static func daysSinceTrained(sessions: [WorkoutSession], now: Date = .now) -> [MuscleGroup: Int] {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: now)
        var result: [MuscleGroup: Int] = [:]
        for session in sessions {
            let days = calendar.dateComponents([.day], from: calendar.startOfDay(for: session.date), to: today).day ?? 0
            for entry in session.entries where !entry.sets.isEmpty {
                guard let exercise = entry.exercise else { continue }
                for muscle in exercise.muscles {
                    result[muscle] = min(result[muscle] ?? Int.max, days)
                }
            }
        }
        return result
    }

    static func suggest(
        place: Place,
        length: WorkoutLength,
        focus: MuscleGroup?,
        sessions: [WorkoutSession],
        hasDumbbells: Bool,
        todaySteps: Double,
        stepGoal: Double
    ) -> [PlannedExercise] {
        let candidates = ExerciseLibrary.all.filter { $0.isAvailable(at: place, hasDumbbells: hasDumbbells) }
        let rest = daysSinceTrained(sessions: sessions)
        let count = length.exerciseCount
        var chosen: [Exercise] = []

        // Hemma: börja med pulshöjande om du rört dig lite idag.
        if place == .home, focus == nil || focus == .cardio, todaySteps < stepGoal / 2,
           let cardio = candidates.filter({ $0.primary == .cardio }).randomElement() {
            chosen.append(cardio)
        }

        let ranked = candidates
            .filter { !chosen.contains($0) }
            .map { exercise -> (Exercise, Double) in
                // Vila 0–7 dagar ger 0–7 poäng. Aldrig tränad räknas som 7.
                var score = Double(min(rest[exercise.primary] ?? 7, 7))
                if let focus { score += exercise.muscles.contains(focus) ? 10 : -10 }
                if place == .gym && exercise.equipment == .gym { score += 1.5 }
                if place == .gym && exercise.primary == .cardio { score -= 4 }
                score += Double.random(in: 0..<2.5)   // lite variation
                return (exercise, score)
            }
            .sorted { $0.1 > $1.1 }

        var perGroup: [MuscleGroup: Int] = [:]
        for exercise in chosen { perGroup[exercise.primary, default: 0] += 1 }
        for (exercise, _) in ranked where chosen.count < count {
            let limit = exercise.primary == focus ? 3 : 2
            if perGroup[exercise.primary, default: 0] < limit {
                chosen.append(exercise)
                perGroup[exercise.primary, default: 0] += 1
            }
        }

        return chosen
            .sorted { $0.primary.sortIndex < $1.primary.sortIndex }
            .map { PlannedExercise(exercise: $0, sets: $0.sets) }
    }

    /// En annan övning för samma muskelgrupp.
    static func replacement(for exercise: Exercise, excluding plan: [Exercise], place: Place, hasDumbbells: Bool) -> Exercise? {
        let pool = ExerciseLibrary.all.filter {
            $0.isAvailable(at: place, hasDumbbells: hasDumbbells) && !plan.contains($0)
        }
        return pool.filter { $0.primary == exercise.primary }.randomElement()
            ?? pool.filter { !Set($0.muscles).isDisjoint(with: exercise.muscles) }.randomElement()
    }

    /// Senaste vikt per övning, för att fylla i automatiskt.
    static func lastWeights(sessions: [WorkoutSession]) -> [String: Double] {
        var result: [String: Double] = [:]
        for session in sessions.sorted(by: { $0.date > $1.date }) {
            for entry in session.entries where result[entry.exerciseID] == nil {
                if let weight = entry.sets.map(\.weight).max(), weight > 0 {
                    result[entry.exerciseID] = weight
                }
            }
        }
        return result
    }
}
