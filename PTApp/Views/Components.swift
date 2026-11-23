import SwiftUI

struct StatTile: View {
    let title: String
    let value: String
    let symbol: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label(title, systemImage: symbol)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold())
                .monospacedDigit()
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }
}

struct CardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(14)
            .background(RoundedRectangle(cornerRadius: 18).fill(Color(.secondarySystemBackground)))
    }
}

extension View {
    func card() -> some View { modifier(CardModifier()) }
}

struct ExerciseRow: View {
    let exercise: Exercise
    var sets: Int? = nil

    var body: some View {
        HStack(spacing: 14) {
            StickFigureView(animation: exercise.animation, props: exercise.props, isPlaying: false)
                .frame(width: 56, height: 56)
                .background(RoundedRectangle(cornerRadius: 12).fill(Color(.tertiarySystemFill)))
            VStack(alignment: .leading, spacing: 3) {
                Text(exercise.name).font(.headline)
                Text("\(sets ?? exercise.sets) set × \(exercise.repsText)")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(exercise.muscles.map(\.name).joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(.tint)
            }
        }
        .padding(.vertical, 2)
    }
}

extension Double {
    var weightText: String { formatted(.number.precision(.fractionLength(0...1))) }
}
