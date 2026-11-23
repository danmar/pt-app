import SwiftUI

/// Animerad streckgubbe som visar en övning.
struct StickFigureView: View {
    let animation: ExerciseAnimation
    var props: [Prop] = []
    /// Om `false` visas en stillbild (slutläget) – används i listor.
    var isPlaying = true
    var color: Color = .accentColor

    var body: some View {
        TimelineView(.animation(paused: !isPlaying)) { timeline in
            Canvas { context, size in
                let phase: Double
                if isPlaying {
                    let t = timeline.date.timeIntervalSinceReferenceDate
                    phase = (1 - cos(2 * .pi * t / animation.period)) / 2
                } else {
                    phase = 1
                }
                let (start, end) = animation.keyframes
                let pose = start.interpolated(to: end, CGFloat(phase))
                let renderer = StickFigureRenderer(size: size, color: color)
                renderer.draw(pose: pose, props: props, frontView: animation.isFrontView, in: &context)
            }
        }
        .aspectRatio(1, contentMode: .fit)
        .accessibilityHidden(true)
    }
}

private struct StickFigureRenderer {
    let size: CGSize
    let color: Color

    // Synligt område: x -0.09…1.09, y -0.18…1.0
    private let viewSize: CGFloat = 1.18
    private var scale: CGFloat { min(size.width, size.height) / viewSize }
    private var origin: CGPoint {
        CGPoint(
            x: (size.width - viewSize * scale) / 2 + 0.09 * scale,
            y: (size.height - viewSize * scale) / 2 + 0.18 * scale)
    }

    private func map(_ p: CGPoint) -> CGPoint {
        CGPoint(x: origin.x + p.x * scale, y: origin.y + p.y * scale)
    }

    private var lineWidth: CGFloat { 0.034 * scale }
    private let propColor = Color.gray

    func draw(pose: Pose, props: [Prop], frontView: Bool, in ctx: inout GraphicsContext) {
        let farOpacity = frontView ? 1.0 : 0.45

        // Golv
        stroke([CGPoint(x: 0, y: 0.96), CGPoint(x: 1, y: 0.96)],
               color: .secondary.opacity(0.4), width: lineWidth * 0.5, in: &ctx)

        if props.contains(.bench) { drawBench(in: &ctx) }
        if props.contains(.pullUpBar) {
            stroke([CGPoint(x: 0.22, y: -0.06), CGPoint(x: 0.84, y: -0.06)],
                   color: propColor, width: lineWidth * 0.7, in: &ctx)
        }

        // Bortre ben och arm
        stroke([pose.hip, pose.kneeF, pose.footF], color: color.opacity(farOpacity), in: &ctx)
        stroke([pose.neck, pose.elbowF, pose.handF], color: color.opacity(farOpacity), in: &ctx)
        if props.contains(.dumbbells) { drawDumbbell(at: pose.handF, opacity: farOpacity, in: &ctx) }

        // Skivstångens viktskiva ligger bakom närmsta handen
        if props.contains(.barbell) { drawPlate(at: pose.handN, in: &ctx) }

        // Kropp, närmsta ben, huvud
        stroke([pose.head, pose.neck, pose.hip], color: color, in: &ctx)
        stroke([pose.hip, pose.kneeN, pose.footN], color: color, in: &ctx)
        let r = 0.058 * scale
        let c = map(pose.head)
        ctx.fill(Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r)),
                 with: .color(color))

        // Närmsta arm
        stroke([pose.neck, pose.elbowN, pose.handN], color: color, in: &ctx)
        if props.contains(.dumbbells) { drawDumbbell(at: pose.handN, opacity: 1, in: &ctx) }
    }

    private func stroke(_ points: [CGPoint], color: Color, width: CGFloat? = nil, in ctx: inout GraphicsContext) {
        guard let first = points.first else { return }
        var path = Path()
        path.move(to: map(first))
        for point in points.dropFirst() { path.addLine(to: map(point)) }
        ctx.stroke(path, with: .color(color),
                   style: StrokeStyle(lineWidth: width ?? lineWidth, lineCap: .round, lineJoin: .round))
    }

    private func drawPlate(at point: CGPoint, in ctx: inout GraphicsContext) {
        let c = map(point)
        let r = 0.075 * scale
        let outer = Path(ellipseIn: CGRect(x: c.x - r, y: c.y - r, width: 2 * r, height: 2 * r))
        ctx.fill(outer, with: .color(propColor.opacity(0.85)))
        let hub = r * 0.25
        ctx.fill(Path(ellipseIn: CGRect(x: c.x - hub, y: c.y - hub, width: 2 * hub, height: 2 * hub)),
                 with: .color(.white.opacity(0.8)))
    }

    private func drawDumbbell(at point: CGPoint, opacity: Double, in ctx: inout GraphicsContext) {
        let c = map(point)
        let w = 0.075 * scale, h = 0.045 * scale
        let rect = CGRect(x: c.x - w / 2, y: c.y - h / 2, width: w, height: h)
        ctx.fill(Path(roundedRect: rect, cornerRadius: h * 0.3), with: .color(propColor.opacity(opacity)))
    }

    private func drawBench(in ctx: inout GraphicsContext) {
        let topLeft = map(CGPoint(x: 0.26, y: 0.72))
        let bottomRight = map(CGPoint(x: 0.84, y: 0.765))
        let seat = CGRect(x: topLeft.x, y: topLeft.y,
                          width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y)
        ctx.fill(Path(roundedRect: seat, cornerRadius: 0.01 * scale), with: .color(propColor.opacity(0.6)))
        for x in [0.32, 0.78] {
            stroke([CGPoint(x: x, y: 0.765), CGPoint(x: x, y: 0.96)],
                   color: propColor.opacity(0.6), width: lineWidth * 0.6, in: &ctx)
        }
    }
}

#Preview {
    ScrollView {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 110))]) {
            ForEach(ExerciseLibrary.all) { ex in
                VStack {
                    StickFigureView(animation: ex.animation, props: ex.props)
                    Text(ex.name).font(.caption)
                }
            }
        }
        .padding()
    }
}
