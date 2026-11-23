import CoreGraphics

/// En ställning för streckgubben. Koordinater i enhetsrymd: x 0…1 (vänster→höger),
/// y 0…1 uppifrån och ner, golvet ligger vid y ≈ 0.96. Gubben tittar åt höger.
/// "N" = närmsta armen/benet, "F" = bortre (ritas lite svagare).
struct Pose {
    var head: CGPoint
    var neck: CGPoint
    var hip: CGPoint
    var elbowN: CGPoint
    var handN: CGPoint
    var elbowF: CGPoint
    var handF: CGPoint
    var kneeN: CGPoint
    var footN: CGPoint
    var kneeF: CGPoint
    var footF: CGPoint

    func with(_ change: (inout Pose) -> Void) -> Pose {
        var copy = self
        change(&copy)
        return copy
    }

    func interpolated(to other: Pose, _ t: CGFloat) -> Pose {
        func lerp(_ a: CGPoint, _ b: CGPoint) -> CGPoint {
            CGPoint(x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t)
        }
        return Pose(
            head: lerp(head, other.head),
            neck: lerp(neck, other.neck),
            hip: lerp(hip, other.hip),
            elbowN: lerp(elbowN, other.elbowN),
            handN: lerp(handN, other.handN),
            elbowF: lerp(elbowF, other.elbowF),
            handF: lerp(handF, other.handF),
            kneeN: lerp(kneeN, other.kneeN),
            footN: lerp(footN, other.footN),
            kneeF: lerp(kneeF, other.kneeF),
            footF: lerp(footF, other.footF)
        )
    }
}

enum Prop: String, Hashable {
    case barbell, dumbbells, bench, pullUpBar
}
