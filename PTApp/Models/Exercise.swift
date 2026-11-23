import Foundation

enum Place: String, Codable, CaseIterable, Identifiable {
    case gym, home
    var id: String { rawValue }

    var name: String {
        switch self {
        case .gym: "Gym"
        case .home: "Hemma"
        }
    }

    var symbol: String {
        switch self {
        case .gym: "dumbbell"
        case .home: "house"
        }
    }
}

/// Ordningen här styr även ordningen i ett pass (kondition först, mage sist).
enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case cardio, legs, back, chest, shoulders, arms, core
    var id: String { rawValue }

    var name: String {
        switch self {
        case .cardio: "Kondition"
        case .legs: "Ben & rumpa"
        case .back: "Rygg"
        case .chest: "Bröst"
        case .shoulders: "Axlar"
        case .arms: "Armar"
        case .core: "Mage & bål"
        }
    }

    var symbol: String {
        switch self {
        case .cardio: "heart.fill"
        case .legs: "figure.step.training"
        case .back: "figure.rower"
        case .chest: "figure.strengthtraining.traditional"
        case .shoulders: "figure.arms.open"
        case .arms: "dumbbell.fill"
        case .core: "figure.core.training"
        }
    }

    var sortIndex: Int { MuscleGroup.allCases.firstIndex(of: self) ?? 0 }
}

enum Equipment: String, Codable {
    case none, dumbbells, gym

    var name: String {
        switch self {
        case .none: "Ingen utrustning"
        case .dumbbells: "Hantlar"
        case .gym: "Gymutrustning"
        }
    }
}

struct Exercise: Identifiable, Hashable {
    let id: String
    let name: String
    /// Första muskelgruppen är den primära.
    let muscles: [MuscleGroup]
    let equipment: Equipment
    let sets: Int
    let repsText: String
    /// Repetitioner, eller sekunder om `isTimed`.
    let defaultReps: Int
    let animation: ExerciseAnimation
    var props: [Prop] = []
    var isTimed = false
    let tips: [String]

    var primary: MuscleGroup { muscles[0] }
    var usesWeight: Bool { equipment != .none }

    func isAvailable(at place: Place, hasDumbbells: Bool) -> Bool {
        switch place {
        case .gym: true
        case .home: equipment == .none || (equipment == .dumbbells && hasDumbbells)
        }
    }

    static func == (lhs: Exercise, rhs: Exercise) -> Bool { lhs.id == rhs.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }
}
