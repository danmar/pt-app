import SwiftUI

struct ExerciseDetailView: View {
    let exercise: Exercise

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                StickFigureView(animation: exercise.animation, props: exercise.props)
                    .frame(maxWidth: .infinity)
                    .frame(height: 280)
                    .background(RoundedRectangle(cornerRadius: 24).fill(Color(.secondarySystemBackground)))

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack {
                        ForEach(exercise.muscles) { muscle in
                            Label(muscle.name, systemImage: muscle.symbol)
                                .font(.caption.bold())
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(Capsule().fill(Color.accentColor.opacity(0.15)))
                        }
                    }
                }

                VStack(spacing: 10) {
                    LabeledContent("Utrustning", value: exercise.equipment.name)
                    LabeledContent("Rekommenderat", value: "\(exercise.sets) set × \(exercise.repsText)")
                }
                .card()

                Text("Så gör du").font(.title3.bold())

                ForEach(Array(exercise.tips.enumerated()), id: \.offset) { index, tip in
                    HStack(alignment: .top, spacing: 12) {
                        Text("\(index + 1)")
                            .font(.subheadline.bold())
                            .foregroundStyle(.white)
                            .frame(width: 26, height: 26)
                            .background(Circle().fill(Color.accentColor))
                        Text(tip)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .padding()
        }
        .navigationTitle(exercise.name)
        .navigationBarTitleDisplayMode(.inline)
    }
}
