import SwiftUI
import SwiftData
import UIKit

struct WorkoutSessionView: View {
    let place: Place

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context
    @Environment(HealthManager.self) private var health
    @AppStorage("saveToHealth") private var saveToHealth = true
    @AppStorage("restSeconds") private var restSeconds = 90

    @State private var items: [SessionItem]
    @State private var index = 0
    @State private var startDate = Date()
    @State private var restEnd: Date?
    @State private var showEndDialog = false

    struct SessionItem: Identifiable {
        let id = UUID()
        let exercise: Exercise
        var sets: [EditableSet]
    }

    struct EditableSet: Identifiable {
        let id = UUID()
        var reps: Int
        var weight: Double
        var done = false
    }

    init(place: Place, plan: [PlannedExercise], lastWeights: [String: Double]) {
        self.place = place
        _items = State(initialValue: plan.map { planned in
            SessionItem(
                exercise: planned.exercise,
                sets: (0..<planned.sets).map { _ in
                    EditableSet(reps: planned.exercise.defaultReps,
                                weight: lastWeights[planned.exercise.id] ?? 0)
                })
        })
    }

    private var completedSets: Int { items.reduce(0) { $0 + $1.sets.filter(\.done).count } }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ProgressView(value: Double(index + 1), total: Double(max(items.count, 1)))
                    .padding(.horizontal)

                TabView(selection: $index) {
                    ForEach(items.indices, id: \.self) { i in
                        exercisePage(i).tag(i)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))

                if let restEnd {
                    restBanner(until: restEnd)
                        .padding(.horizontal)
                        .padding(.bottom, 6)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }

                bottomBar
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Avsluta") { showEndDialog = true }
                }
                ToolbarItem(placement: .principal) {
                    VStack(spacing: 0) {
                        Text("Övning \(index + 1) av \(items.count)").font(.headline)
                        Text(startDate, style: .timer)
                            .font(.caption)
                            .monospacedDigit()
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .confirmationDialog("Avsluta passet?", isPresented: $showEndDialog, titleVisibility: .visible) {
                Button("Spara och avsluta") { finish() }
                Button("Släng passet", role: .destructive) { dismiss() }
                Button("Fortsätt träna", role: .cancel) {}
            } message: {
                Text("Du har klarat \(completedSets) set.")
            }
        }
        .onAppear { UIApplication.shared.isIdleTimerDisabled = true }
        .onDisappear { UIApplication.shared.isIdleTimerDisabled = false }
    }

    // MARK: - Delar

    private func exercisePage(_ i: Int) -> some View {
        let exercise = items[i].exercise
        return ScrollView {
            VStack(spacing: 14) {
                StickFigureView(animation: exercise.animation, props: exercise.props)
                    .frame(height: 220)
                    .frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 24).fill(Color(.secondarySystemBackground)))

                VStack(spacing: 4) {
                    Text(exercise.name).font(.title2.bold())
                    Text("\(exercise.sets) set × \(exercise.repsText)")
                        .foregroundStyle(.secondary)
                }

                DisclosureGroup("Så gör du") {
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(exercise.tips, id: \.self) { tip in
                            Label(tip, systemImage: "checkmark")
                                .font(.callout)
                        }
                    }
                    .padding(.top, 6)
                }
                .card()

                VStack(spacing: 8) {
                    ForEach(Array(items[i].sets.indices), id: \.self) { s in
                        SetRow(
                            number: s + 1,
                            set: $items[i].sets[s],
                            showWeight: exercise.usesWeight,
                            timed: exercise.isTimed,
                            onCompleted: startRest)
                    }
                    Button {
                        if let last = items[i].sets.last {
                            items[i].sets.append(EditableSet(reps: last.reps, weight: last.weight))
                        }
                    } label: {
                        Label("Lägg till set", systemImage: "plus")
                            .font(.subheadline)
                    }
                    .padding(.top, 4)
                }
            }
            .padding()
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func restBanner(until end: Date) -> some View {
        TimelineView(.periodic(from: .now, by: 1)) { timeline in
            let remaining = Int(end.timeIntervalSince(timeline.date).rounded(.up))
            HStack {
                Image(systemName: remaining > 0 ? "timer" : "bell.fill")
                if remaining > 0 {
                    Text("Vila \(remaining) s").monospacedDigit().bold()
                } else {
                    Text("Dags för nästa set! 💪").bold()
                }
                Spacer()
                if remaining > 0 {
                    Button("+15 s") { restEnd = end.addingTimeInterval(15) }
                }
                Button(remaining > 0 ? "Hoppa över" : "OK") {
                    withAnimation { restEnd = nil }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Capsule().fill(remaining > 0 ? Color.orange.opacity(0.2) : Color.green.opacity(0.25)))
        }
    }

    private var bottomBar: some View {
        HStack(spacing: 12) {
            Button {
                withAnimation { index -= 1 }
            } label: {
                Image(systemName: "chevron.left")
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.bordered)
            .disabled(index == 0)

            if index < items.count - 1 {
                Button {
                    withAnimation { index += 1 }
                } label: {
                    Text("Nästa övning")
                        .bold()
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .buttonStyle(.borderedProminent)
            } else {
                Button {
                    finish()
                } label: {
                    Text("Klar – spara passet")
                        .bold()
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
                .buttonStyle(.borderedProminent)
                .tint(.green)
            }
        }
        .padding()
    }

    // MARK: - Logik

    private func startRest() {
        withAnimation { restEnd = Date().addingTimeInterval(TimeInterval(restSeconds)) }
    }

    private func finish() {
        let entries: [EntryRecord] = items.compactMap { item in
            let done = item.sets.filter(\.done).map { SetRecord(reps: $0.reps, weight: $0.weight) }
            return done.isEmpty ? nil : EntryRecord(exerciseID: item.exercise.id, sets: done)
        }
        if !entries.isEmpty {
            let start = startDate
            let end = Date()
            context.insert(WorkoutSession(date: start, endDate: end, place: place, entries: entries))
            if saveToHealth {
                let manager = self.health
                let trainedAt = self.place
                Task { await manager.saveWorkout(place: trainedAt, start: start, end: end) }
            }
        }
        dismiss()
    }
}

private struct SetRow: View {
    let number: Int
    @Binding var set: WorkoutSessionView.EditableSet
    let showWeight: Bool
    let timed: Bool
    let onCompleted: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            Text("\(number)")
                .font(.headline)
                .frame(width: 30, height: 30)
                .background(Circle().fill(Color(.tertiarySystemFill)))

            if showWeight {
                HStack(spacing: 4) {
                    TextField("0", value: $set.weight, format: .number)
                        .keyboardType(.decimalPad)
                        .multilineTextAlignment(.trailing)
                        .frame(width: 52)
                        .textFieldStyle(.roundedBorder)
                    Text("kg").foregroundStyle(.secondary)
                }
            }

            Spacer(minLength: 4)

            Text(timed ? "\(set.reps) s" : "\(set.reps) st")
                .monospacedDigit()
                .frame(minWidth: 44, alignment: .trailing)
            Stepper("Antal", value: $set.reps, in: 1...300, step: timed ? 5 : 1)
                .labelsHidden()

            Button {
                set.done.toggle()
                if set.done { onCompleted() }
            } label: {
                Image(systemName: set.done ? "checkmark.circle.fill" : "circle")
                    .font(.title)
                    .foregroundStyle(set.done ? Color.green : Color.secondary)
            }
            .buttonStyle(.plain)
            .sensoryFeedback(.success, trigger: set.done)
        }
        .padding(10)
        .background(RoundedRectangle(cornerRadius: 14).fill(Color(.secondarySystemBackground)))
        .opacity(set.done ? 0.7 : 1)
    }
}
