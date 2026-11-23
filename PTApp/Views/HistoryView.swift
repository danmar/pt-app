import SwiftUI
import SwiftData

struct HistoryView: View {
    @Query(sort: \WorkoutSession.date, order: .reverse) private var sessions: [WorkoutSession]
    @Environment(\.modelContext) private var context

    private var thisWeek: [WorkoutSession] {
        let weekAgo = Calendar.current.date(byAdding: .day, value: -7, to: .now)!
        return sessions.filter { $0.date >= weekAgo }
    }

    var body: some View {
        NavigationStack {
            Group {
                if sessions.isEmpty {
                    ContentUnavailableView(
                        "Inga pass än",
                        systemImage: "figure.strengthtraining.traditional",
                        description: Text("Starta ett pass under Gym eller Hemma så sparas det här."))
                } else {
                    List {
                        Section("Senaste 7 dagarna") {
                            HStack(spacing: 10) {
                                StatTile(title: "Pass", value: "\(thisWeek.count)", symbol: "calendar")
                                StatTile(title: "Set", value: "\(thisWeek.reduce(0) { $0 + $1.totalSets })", symbol: "square.stack.3d.up")
                                StatTile(title: "Tid", value: "\(Int(thisWeek.reduce(0) { $0 + $1.duration } / 60)) min", symbol: "clock")
                            }
                            .listRowInsets(EdgeInsets())
                            .listRowBackground(Color.clear)
                        }

                        Section("Alla pass") {
                            ForEach(sessions) { session in
                                NavigationLink {
                                    SessionDetailView(session: session)
                                } label: {
                                    SessionRow(session: session)
                                }
                            }
                            .onDelete { offsets in
                                for offset in offsets { context.delete(sessions[offset]) }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Logg")
        }
    }
}

private struct SessionRow: View {
    let session: WorkoutSession

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: session.place.symbol)
                .font(.title3)
                .foregroundStyle(.tint)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(session.date, format: .dateTime.weekday(.wide).day().month(.wide))
                    .font(.headline)
                Text("\(session.entries.count) övningar · \(session.totalSets) set · \(Int(session.duration / 60)) min")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct SessionDetailView: View {
    let session: WorkoutSession

    var body: some View {
        List {
            ForEach(Array(session.entries.enumerated()), id: \.offset) { _, entry in
                Section(entry.exercise?.name ?? entry.exerciseID) {
                    ForEach(Array(entry.sets.enumerated()), id: \.offset) { number, set in
                        HStack {
                            Text("Set \(number + 1)")
                            Spacer()
                            if entry.exercise?.isTimed == true {
                                Text("\(set.reps) s").monospacedDigit()
                            } else if set.weight > 0 {
                                Text("\(set.reps) × \(set.weight.weightText) kg").monospacedDigit()
                            } else {
                                Text("\(set.reps) st").monospacedDigit()
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle(session.date.formatted(.dateTime.day().month().hour().minute()))
        .navigationBarTitleDisplayMode(.inline)
    }
}
