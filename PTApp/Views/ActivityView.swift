import SwiftUI
import Charts

struct ActivityView: View {
    @Environment(HealthManager.self) private var health
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("stepGoal") private var stepGoal = 8000
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    if !health.isAvailable {
                        ContentUnavailableView(
                            "Apple Hälsa saknas",
                            systemImage: "heart.slash",
                            description: Text("Stegräkning kräver en iPhone med Hälsa-appen."))
                    }

                    StepRing(steps: health.todaySteps, goal: Double(stepGoal))
                        .frame(width: 230, height: 230)
                        .padding(.top, 8)

                    Text(coachMessage)
                        .font(.callout)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)

                    HStack(spacing: 10) {
                        StatTile(title: "Distans", value: "\(health.todayDistanceKm.formatted(.number.precision(.fractionLength(1)))) km", symbol: "map")
                        StatTile(title: "Energi", value: "\(Int(health.todayActiveKcal)) kcal", symbol: "flame")
                        StatTile(title: "Svit", value: "\(health.streak(goal: Double(stepGoal))) d", symbol: "bolt.fill")
                    }

                    weekChart
                    walksSection

                    if let error = health.errorMessage {
                        Text(error).font(.footnote).foregroundStyle(.red)
                    }
                }
                .padding()
            }
            .navigationTitle("Idag")
            .toolbar {
                Button { showSettings = true } label: { Image(systemName: "gearshape") }
            }
            .sheet(isPresented: $showSettings) { SettingsView() }
            .refreshable { await health.refresh() }
            .task { await health.refresh() }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { Task { await health.refresh() } }
            }
        }
    }

    private var coachMessage: String {
        let remaining = Double(stepGoal) - health.todaySteps
        if remaining <= 0 { return "Snyggt! Du har nått dagens mål. 🎉" }
        let minutes = Int((remaining / 100).rounded(.up))   // ca 100 steg per minut
        return "\(Int(remaining).formatted()) steg kvar – ungefär \(minutes) minuters promenad."
    }

    private var weekChart: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Senaste veckan").font(.headline)
            Chart {
                ForEach(health.last7Days) { day in
                    BarMark(
                        x: .value("Dag", day.date, unit: .day),
                        y: .value("Steg", day.value))
                    .foregroundStyle(day.value >= Double(stepGoal) ? Color.green : Color.accentColor.opacity(0.6))
                    .cornerRadius(5)
                }
                RuleMark(y: .value("Mål", stepGoal))
                    .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    .foregroundStyle(.secondary)
                    .annotation(position: .top, alignment: .leading) {
                        Text("Mål").font(.caption2).foregroundStyle(.secondary)
                    }
            }
            .chartXAxis {
                AxisMarks(values: .stride(by: .day)) { _ in
                    AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                }
            }
            .frame(height: 180)
        }
        .card()
    }

    @ViewBuilder
    private var walksSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Promenader i veckan").font(.headline)
            if health.walks.isEmpty {
                Text("Inga registrerade promenadpass. Starta \"Utomhuspromenad\" i Fitness-appen eller på Apple Watch så dyker de upp här. Vanliga steg räknas ändå automatiskt.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(health.walks) { walk in
                    HStack {
                        Image(systemName: "figure.walk")
                            .foregroundStyle(.tint)
                            .frame(width: 28)
                        VStack(alignment: .leading) {
                            Text(walk.start, format: .dateTime.weekday(.wide).hour().minute())
                            Text("\(Int(walk.duration / 60)) min")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if let km = walk.distanceKm {
                            Text("\(km.formatted(.number.precision(.fractionLength(1)))) km")
                                .bold()
                                .monospacedDigit()
                        }
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .card()
    }
}

struct StepRing: View {
    let steps: Double
    let goal: Double

    private var progress: Double { goal > 0 ? steps / goal : 0 }

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.accentColor.opacity(0.15), lineWidth: 22)
            Circle()
                .trim(from: 0, to: min(progress, 1))
                .stroke(
                    AngularGradient(colors: [.accentColor.opacity(0.7), .accentColor, .green], center: .center),
                    style: StrokeStyle(lineWidth: 22, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeOut(duration: 0.8), value: progress)
            VStack(spacing: 2) {
                Image(systemName: "figure.walk")
                    .font(.title2)
                    .foregroundStyle(.tint)
                Text(Int(steps).formatted())
                    .font(.system(size: 44, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .contentTransition(.numericText())
                Text("av \(Int(goal).formatted()) steg")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
