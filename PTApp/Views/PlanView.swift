import SwiftUI
import SwiftData

/// Används både för fliken Gym och Hemma.
struct PlanView: View {
    let place: Place

    @Environment(HealthManager.self) private var health
    @Query(sort: \WorkoutSession.date, order: .reverse) private var sessions: [WorkoutSession]
    @AppStorage("hasDumbbells") private var hasDumbbells = false
    @AppStorage("stepGoal") private var stepGoal = 8000

    @State private var length: WorkoutLength = .medium
    @State private var focus: MuscleGroup?
    @State private var plan: [PlannedExercise] = []
    @State private var activeWorkout: ActiveWorkout?

    struct ActiveWorkout: Identifiable {
        let id = UUID()
        let plan: [PlannedExercise]
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Längd", selection: $length) {
                        ForEach(WorkoutLength.allCases) { Text($0.label).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    Picker("Fokus", selection: $focus) {
                        Text("Automatiskt").tag(MuscleGroup?.none)
                        ForEach(MuscleGroup.allCases) { group in
                            Label(group.name, systemImage: group.symbol).tag(Optional(group))
                        }
                    }
                } footer: {
                    Text(recoveryText)
                }

                if place == .home && health.todaySteps < Double(stepGoal) / 2 {
                    Section {
                        Label("Du har gått \(Int(health.todaySteps).formatted()) steg idag. En rask promenad på 20 min före eller efter passet gör stor skillnad!",
                              systemImage: "figure.walk")
                            .font(.callout)
                    }
                }

                Section("Dagens förslag") {
                    ForEach(plan) { item in
                        NavigationLink(value: item.exercise) {
                            ExerciseRow(exercise: item.exercise, sets: item.sets)
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                plan.removeAll { $0.id == item.id }
                            } label: {
                                Label("Ta bort", systemImage: "trash")
                            }
                            Button {
                                swap(item)
                            } label: {
                                Label("Byt", systemImage: "arrow.left.arrow.right")
                            }
                            .tint(.orange)
                        }
                    }

                    Button {
                        withAnimation { regenerate() }
                    } label: {
                        Label("Nytt förslag", systemImage: "arrow.triangle.2.circlepath")
                    }
                }

                Section {
                    Button {
                        activeWorkout = ActiveWorkout(plan: plan)
                    } label: {
                        Label("Starta passet", systemImage: "play.fill")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(plan.isEmpty)
                }

                Section {
                    NavigationLink {
                        ExerciseLibraryView(place: place)
                    } label: {
                        Label("Alla övningar", systemImage: "books.vertical")
                    }
                }
            }
            .navigationTitle(place == .gym ? "Gym" : "Hemma")
            .navigationDestination(for: Exercise.self) { ExerciseDetailView(exercise: $0) }
            .onAppear { if plan.isEmpty { regenerate() } }
            .onChange(of: length) { regenerate() }
            .onChange(of: focus) { regenerate() }
            .onChange(of: hasDumbbells) { regenerate() }
            .onChange(of: sessions.count) { regenerate() }
            .fullScreenCover(item: $activeWorkout) { workout in
                WorkoutSessionView(
                    place: place,
                    plan: workout.plan,
                    lastWeights: WorkoutPlanner.lastWeights(sessions: sessions))
            }
        }
    }

    private var recoveryText: String {
        let rest = WorkoutPlanner.daysSinceTrained(sessions: sessions)
        let groups = Array(Set(plan.map(\.exercise.primary))).sorted { $0.sortIndex < $1.sortIndex }
        guard !groups.isEmpty else { return "" }
        let parts = groups.map { group -> String in
            guard let days = rest[group] else { return "\(group.name) (ny)" }
            return days == 0 ? "\(group.name) (idag)" : "\(group.name) (\(days) d vila)"
        }
        return "Förslaget väljer muskler du vilat längst: " + parts.joined(separator: ", ") + ". Svep på en övning för att byta eller ta bort."
    }

    private func regenerate() {
        plan = WorkoutPlanner.suggest(
            place: place,
            length: length,
            focus: focus,
            sessions: sessions,
            hasDumbbells: hasDumbbells,
            todaySteps: health.todaySteps,
            stepGoal: Double(stepGoal))
    }

    private func swap(_ item: PlannedExercise) {
        guard let index = plan.firstIndex(where: { $0.id == item.id }),
              let replacement = WorkoutPlanner.replacement(
                for: item.exercise,
                excluding: plan.map(\.exercise),
                place: place,
                hasDumbbells: hasDumbbells)
        else { return }
        withAnimation {
            plan[index] = PlannedExercise(exercise: replacement, sets: replacement.sets)
        }
    }
}
