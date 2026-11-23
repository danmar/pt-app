import CoreGraphics

private func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x, y: y) }

/// Varje animation pendlar mjukt mellan två ställningar.
enum ExerciseAnimation: String, Hashable {
    case squat, gobletSquat, barbellSquat, deadlift, lunge, gluteBridge
    case benchPress, pushUp, shoulderPress, bicepCurl, tricepsExtension
    case row, pullUp, superman, plank, crunch, jumpingJack, mountainClimber

    /// Sekunder för en hel rörelse (fram och tillbaka).
    var period: Double {
        switch self {
        case .plank: 3.0
        case .jumpingJack: 1.0
        case .mountainClimber: 0.8
        case .bicepCurl, .crunch: 2.0
        default: 2.6
        }
    }

    /// Framifrån istället för från sidan (båda sidor ritas lika starkt).
    var isFrontView: Bool { self == .jumpingJack }

    var keyframes: (Pose, Pose) {
        switch self {
        case .squat: (Poses.squatTop, Poses.squatBottom)
        case .gobletSquat: (Poses.gobletTop, Poses.gobletBottom)
        case .barbellSquat: (Poses.barbellSquatTop, Poses.barbellSquatBottom)
        case .deadlift: (Poses.standing, Poses.deadliftBottom)
        case .lunge: (Poses.lungeTop, Poses.lungeBottom)
        case .gluteBridge: (Poses.bridgeDown, Poses.bridgeUp)
        case .benchPress: (Poses.benchUp, Poses.benchDown)
        case .pushUp: (Poses.pushUpTop, Poses.pushUpBottom)
        case .shoulderPress: (Poses.pressDown, Poses.pressUp)
        case .bicepCurl: (Poses.curlDown, Poses.curlUp)
        case .tricepsExtension: (Poses.tricepsUp, Poses.tricepsDown)
        case .row: (Poses.rowDown, Poses.rowUp)
        case .pullUp: (Poses.pullDown, Poses.pullUp)
        case .superman: (Poses.supermanDown, Poses.supermanUp)
        case .plank: (Poses.plankA, Poses.plankB)
        case .crunch: (Poses.crunchDown, Poses.crunchUp)
        case .jumpingJack: (Poses.jackIn, Poses.jackOut)
        case .mountainClimber: (Poses.climberA, Poses.climberB)
        }
    }
}

private enum Poses {
    // MARK: Stående
    static let standing = Pose(
        head: p(0.50, 0.12), neck: p(0.50, 0.22), hip: p(0.50, 0.50),
        elbowN: p(0.52, 0.36), handN: p(0.53, 0.49),
        elbowF: p(0.48, 0.36), handF: p(0.47, 0.49),
        kneeN: p(0.52, 0.72), footN: p(0.53, 0.95),
        kneeF: p(0.48, 0.72), footF: p(0.47, 0.95))

    // MARK: Knäböj
    static let squatTop = Poses.standing.with {
        $0.elbowN = p(0.62, 0.24); $0.handN = p(0.75, 0.24)
        $0.elbowF = p(0.61, 0.25); $0.handF = p(0.74, 0.25)
    }
    static let squatBottom = Pose(
        head: p(0.58, 0.34), neck: p(0.52, 0.43), hip: p(0.36, 0.66),
        elbowN: p(0.65, 0.45), handN: p(0.78, 0.44),
        elbowF: p(0.64, 0.46), handF: p(0.77, 0.45),
        kneeN: p(0.58, 0.71), footN: p(0.53, 0.95),
        kneeF: p(0.56, 0.72), footF: p(0.47, 0.95))

    static let gobletTop = Poses.standing.with {
        $0.elbowN = p(0.55, 0.35); $0.handN = p(0.60, 0.28)
        $0.elbowF = p(0.54, 0.35); $0.handF = p(0.59, 0.28)
    }
    static let gobletBottom = Poses.squatBottom.with {
        $0.elbowN = p(0.58, 0.55); $0.handN = p(0.64, 0.47)
        $0.elbowF = p(0.57, 0.55); $0.handF = p(0.63, 0.47)
    }

    static let barbellSquatTop = Poses.standing.with {
        $0.elbowN = p(0.42, 0.30); $0.handN = p(0.46, 0.20)
        $0.elbowF = p(0.41, 0.30); $0.handF = p(0.45, 0.20)
    }
    static let barbellSquatBottom = Poses.squatBottom.with {
        $0.elbowN = p(0.44, 0.50); $0.handN = p(0.49, 0.41)
        $0.elbowF = p(0.43, 0.50); $0.handF = p(0.48, 0.41)
    }

    // MARK: Marklyft
    static let deadliftBottom = Pose(
        head: p(0.67, 0.42), neck: p(0.58, 0.46), hip: p(0.32, 0.60),
        elbowN: p(0.59, 0.60), handN: p(0.59, 0.73),
        elbowF: p(0.58, 0.60), handF: p(0.58, 0.73),
        kneeN: p(0.52, 0.72), footN: p(0.53, 0.95),
        kneeF: p(0.50, 0.73), footF: p(0.47, 0.95))

    // MARK: Utfall
    static let lungeTop = Pose(
        head: p(0.50, 0.13), neck: p(0.50, 0.23), hip: p(0.50, 0.51),
        elbowN: p(0.51, 0.37), handN: p(0.52, 0.50),
        elbowF: p(0.49, 0.37), handF: p(0.48, 0.50),
        kneeN: p(0.60, 0.73), footN: p(0.68, 0.95),
        kneeF: p(0.38, 0.73), footF: p(0.25, 0.94))
    static let lungeBottom = Pose(
        head: p(0.50, 0.30), neck: p(0.50, 0.40), hip: p(0.50, 0.68),
        elbowN: p(0.51, 0.54), handN: p(0.52, 0.67),
        elbowF: p(0.49, 0.54), handF: p(0.48, 0.67),
        kneeN: p(0.69, 0.72), footN: p(0.68, 0.95),
        kneeF: p(0.42, 0.90), footF: p(0.24, 0.93))

    // MARK: Höftlyft (ligger på rygg, huvudet till vänster)
    static let bridgeDown = Pose(
        head: p(0.20, 0.88), neck: p(0.30, 0.90), hip: p(0.56, 0.90),
        elbowN: p(0.38, 0.93), handN: p(0.48, 0.93),
        elbowF: p(0.37, 0.93), handF: p(0.47, 0.93),
        kneeN: p(0.68, 0.72), footN: p(0.79, 0.94),
        kneeF: p(0.67, 0.73), footF: p(0.78, 0.94))
    static let bridgeUp = Poses.bridgeDown.with {
        $0.hip = p(0.55, 0.74)
        $0.kneeN = p(0.74, 0.69); $0.kneeF = p(0.73, 0.70)
    }

    // MARK: Bänkpress (ligger på bänk, huvudet till höger)
    static let benchUp = Pose(
        head: p(0.78, 0.66), neck: p(0.68, 0.69), hip: p(0.40, 0.69),
        elbowN: p(0.68, 0.55), handN: p(0.68, 0.42),
        elbowF: p(0.67, 0.55), handF: p(0.67, 0.42),
        kneeN: p(0.20, 0.67), footN: p(0.18, 0.95),
        kneeF: p(0.22, 0.68), footF: p(0.21, 0.95))
    static let benchDown = Poses.benchUp.with {
        $0.elbowN = p(0.60, 0.76); $0.handN = p(0.66, 0.62)
        $0.elbowF = p(0.59, 0.77); $0.handF = p(0.65, 0.63)
    }

    // MARK: Armhävningar
    static let pushUpTop = Pose(
        head: p(0.77, 0.58), neck: p(0.68, 0.62), hip: p(0.40, 0.775),
        elbowN: p(0.68, 0.78), handN: p(0.68, 0.94),
        elbowF: p(0.67, 0.78), handF: p(0.67, 0.94),
        kneeN: p(0.26, 0.853), footN: p(0.12, 0.94),
        kneeF: p(0.27, 0.85), footF: p(0.13, 0.94))
    static let pushUpBottom = Pose(
        head: p(0.77, 0.77), neck: p(0.68, 0.80), hip: p(0.40, 0.865),
        elbowN: p(0.58, 0.81), handN: p(0.68, 0.94),
        elbowF: p(0.57, 0.82), handF: p(0.67, 0.94),
        kneeN: p(0.26, 0.90), footN: p(0.12, 0.94),
        kneeF: p(0.27, 0.90), footF: p(0.13, 0.94))

    // MARK: Axlar & armar
    static let pressDown = Poses.standing.with {
        $0.elbowN = p(0.60, 0.30); $0.handN = p(0.59, 0.17)
        $0.elbowF = p(0.59, 0.31); $0.handF = p(0.58, 0.18)
    }
    static let pressUp = Poses.standing.with {
        $0.elbowN = p(0.55, 0.09); $0.handN = p(0.56, -0.04)
        $0.elbowF = p(0.54, 0.09); $0.handF = p(0.55, -0.04)
    }

    static let curlDown = Poses.standing.with {
        $0.elbowN = p(0.52, 0.36); $0.handN = p(0.55, 0.49)
        $0.elbowF = p(0.50, 0.36); $0.handF = p(0.53, 0.49)
    }
    static let curlUp = Poses.curlDown.with {
        $0.handN = p(0.63, 0.26); $0.handF = p(0.61, 0.26)
    }

    static let tricepsUp = Poses.standing.with {
        $0.elbowN = p(0.54, 0.09); $0.handN = p(0.55, -0.04)
        $0.elbowF = p(0.53, 0.09); $0.handF = p(0.54, -0.04)
    }
    static let tricepsDown = Poses.standing.with {
        $0.elbowN = p(0.55, 0.09); $0.handN = p(0.43, 0.15)
        $0.elbowF = p(0.54, 0.09); $0.handF = p(0.42, 0.15)
    }

    // MARK: Rygg
    static let rowDown = Pose(
        head: p(0.73, 0.36), neck: p(0.64, 0.40), hip: p(0.38, 0.52),
        elbowN: p(0.64, 0.54), handN: p(0.64, 0.67),
        elbowF: p(0.63, 0.54), handF: p(0.63, 0.67),
        kneeN: p(0.50, 0.72), footN: p(0.47, 0.95),
        kneeF: p(0.48, 0.72), footF: p(0.45, 0.95))
    static let rowUp = Poses.rowDown.with {
        $0.elbowN = p(0.52, 0.37); $0.handN = p(0.56, 0.50)
        $0.elbowF = p(0.51, 0.38); $0.handF = p(0.55, 0.51)
    }

    static let pullDown = Pose(
        head: p(0.49, 0.12), neck: p(0.50, 0.22), hip: p(0.50, 0.50),
        elbowN: p(0.52, 0.085), handN: p(0.53, -0.05),
        elbowF: p(0.51, 0.085), handF: p(0.52, -0.05),
        kneeN: p(0.49, 0.72), footN: p(0.38, 0.90),
        kneeF: p(0.48, 0.72), footF: p(0.37, 0.90))
    static let pullUp = Pose(
        head: p(0.50, -0.08), neck: p(0.50, 0.02), hip: p(0.50, 0.30),
        elbowN: p(0.41, 0.04), handN: p(0.53, -0.05),
        elbowF: p(0.40, 0.04), handF: p(0.52, -0.05),
        kneeN: p(0.49, 0.52), footN: p(0.38, 0.70),
        kneeF: p(0.48, 0.52), footF: p(0.37, 0.70))

    static let supermanDown = Pose(
        head: p(0.80, 0.89), neck: p(0.70, 0.92), hip: p(0.42, 0.92),
        elbowN: p(0.83, 0.92), handN: p(0.96, 0.92),
        elbowF: p(0.82, 0.925), handF: p(0.95, 0.925),
        kneeN: p(0.26, 0.925), footN: p(0.10, 0.93),
        kneeF: p(0.27, 0.93), footF: p(0.11, 0.935))
    static let supermanUp = Poses.supermanDown.with {
        $0.neck = p(0.69, 0.87); $0.head = p(0.79, 0.82)
        $0.elbowN = p(0.82, 0.83); $0.handN = p(0.95, 0.78)
        $0.elbowF = p(0.81, 0.835); $0.handF = p(0.94, 0.785)
        $0.kneeN = p(0.26, 0.90); $0.footN = p(0.11, 0.85)
        $0.kneeF = p(0.27, 0.905); $0.footF = p(0.12, 0.855)
    }

    // MARK: Mage
    static let plankA = Pose(
        head: p(0.76, 0.74), neck: p(0.66, 0.78), hip: p(0.40, 0.85),
        elbowN: p(0.66, 0.94), handN: p(0.80, 0.94),
        elbowF: p(0.65, 0.94), handF: p(0.79, 0.94),
        kneeN: p(0.26, 0.89), footN: p(0.12, 0.94),
        kneeF: p(0.27, 0.89), footF: p(0.13, 0.94))
    static let plankB = Poses.plankA.with {
        $0.hip = p(0.40, 0.835)
        $0.neck = p(0.66, 0.775); $0.head = p(0.76, 0.735)
    }

    static let crunchDown = Pose(
        head: p(0.20, 0.88), neck: p(0.30, 0.90), hip: p(0.56, 0.90),
        elbowN: p(0.30, 0.79), handN: p(0.21, 0.83),
        elbowF: p(0.29, 0.80), handF: p(0.20, 0.84),
        kneeN: p(0.68, 0.72), footN: p(0.80, 0.94),
        kneeF: p(0.67, 0.73), footF: p(0.79, 0.94))
    static let crunchUp = Poses.crunchDown.with {
        $0.neck = p(0.37, 0.77); $0.head = p(0.29, 0.71)
        $0.elbowN = p(0.42, 0.66); $0.handN = p(0.30, 0.66)
        $0.elbowF = p(0.41, 0.67); $0.handF = p(0.29, 0.67)
    }

    // MARK: Kondition
    static let jackIn = Pose(
        head: p(0.50, 0.11), neck: p(0.50, 0.21), hip: p(0.50, 0.50),
        elbowN: p(0.58, 0.35), handN: p(0.60, 0.48),
        elbowF: p(0.42, 0.35), handF: p(0.40, 0.48),
        kneeN: p(0.53, 0.72), footN: p(0.54, 0.95),
        kneeF: p(0.47, 0.72), footF: p(0.46, 0.95))
    static let jackOut = Pose(
        head: p(0.50, 0.09), neck: p(0.50, 0.19), hip: p(0.50, 0.47),
        elbowN: p(0.62, 0.08), handN: p(0.58, -0.05),
        elbowF: p(0.38, 0.08), handF: p(0.42, -0.05),
        kneeN: p(0.59, 0.71), footN: p(0.67, 0.94),
        kneeF: p(0.41, 0.71), footF: p(0.33, 0.94))

    static let climberA = Poses.pushUpTop.with {
        $0.kneeN = p(0.58, 0.82); $0.footN = p(0.50, 0.93)
    }
    static let climberB = Poses.pushUpTop.with {
        $0.kneeF = p(0.58, 0.82); $0.footF = p(0.50, 0.93)
    }
}
