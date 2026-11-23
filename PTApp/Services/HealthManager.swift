import Foundation
import HealthKit
import Observation

struct DailyValue: Identifiable, Hashable {
    let date: Date
    let value: Double
    var id: Date { date }
}

struct WalkSummary: Identifiable {
    let id: UUID
    let start: Date
    let duration: TimeInterval
    let distanceKm: Double?
}

/// Läser steg, distans och promenader från Apple Hälsa och sparar träningspass dit.
/// iPhone räknar steg automatiskt i bakgrunden – vi hämtar bara siffrorna.
@MainActor
@Observable
final class HealthManager {
    private let store = HKHealthStore()
    let isAvailable = HKHealthStore.isHealthDataAvailable()

    var todaySteps: Double = 0
    var todayDistanceKm: Double = 0
    var todayActiveKcal: Double = 0
    var last30Days: [DailyValue] = []
    var walks: [WalkSummary] = []
    var lastUpdated: Date?
    var errorMessage: String?

    var last7Days: [DailyValue] { Array(last30Days.suffix(7)) }

    private let readTypes: Set<HKObjectType> = [
        HKQuantityType(.stepCount),
        HKQuantityType(.distanceWalkingRunning),
        HKQuantityType(.activeEnergyBurned),
        HKObjectType.workoutType()
    ]
    private let shareTypes: Set<HKSampleType> = [HKObjectType.workoutType()]

    /// Visar Apples behörighetsdialog första gången, sedan händer inget.
    func requestAuthorization() async {
        guard isAvailable else { return }
        do {
            try await store.requestAuthorization(toShare: shareTypes, read: readTypes)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func refresh() async {
        guard isAvailable else { return }
        await requestAuthorization()

        let calendar = Calendar.current
        let todayStart = calendar.startOfDay(for: .now)
        let monthStart = calendar.date(byAdding: .day, value: -29, to: todayStart)!
        let weekStart = calendar.date(byAdding: .day, value: -6, to: todayStart)!

        last30Days = (try? await dailySums(.stepCount, unit: .count(), from: monthStart)) ?? []
        todaySteps = last30Days.last?.value ?? 0
        todayDistanceKm = (try? await sum(.distanceWalkingRunning, unit: .meterUnit(with: .kilo), from: todayStart)) ?? 0
        todayActiveKcal = (try? await sum(.activeEnergyBurned, unit: .kilocalorie(), from: todayStart)) ?? 0
        walks = (try? await recentWalks(since: weekStart)) ?? []
        lastUpdated = .now
    }

    /// Antal dagar i rad (bakåt från igår/idag) där stegmålet nåtts.
    func streak(goal: Double) -> Int {
        var days = last30Days
        // Dagens mål är inte nått än – det bryter inte sviten.
        if let today = days.last, today.value < goal { days.removeLast() }
        var count = 0
        for day in days.reversed() {
            guard day.value >= goal else { break }
            count += 1
        }
        return count
    }

    func saveWorkout(place: Place, start: Date, end: Date) async {
        guard isAvailable else { return }
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = place == .gym ? .traditionalStrengthTraining : .functionalStrengthTraining
        configuration.locationType = .indoor
        let builder = HKWorkoutBuilder(healthStore: store, configuration: configuration, device: .local())
        do {
            try await builder.beginCollection(at: start)
            try await builder.endCollection(at: end)
            _ = try await builder.finishWorkout()
        } catch {
            errorMessage = "Kunde inte spara passet i Hälsa: \(error.localizedDescription)"
        }
    }

    // MARK: - Frågor mot HealthKit

    private func dailySums(_ id: HKQuantityTypeIdentifier, unit: HKUnit, from start: Date) async throws -> [DailyValue] {
        let type = HKQuantityType(id)
        let descriptor = HKStatisticsCollectionQueryDescriptor(
            predicate: .quantitySample(type: type, predicate: HKQuery.predicateForSamples(withStart: start, end: nil)),
            options: .cumulativeSum,
            anchorDate: start,
            intervalComponents: DateComponents(day: 1))
        let collection = try await descriptor.result(for: store)
        var result: [DailyValue] = []
        collection.enumerateStatistics(from: start, to: .now) { statistics, _ in
            result.append(DailyValue(date: statistics.startDate,
                                     value: statistics.sumQuantity()?.doubleValue(for: unit) ?? 0))
        }
        return result
    }

    private func sum(_ id: HKQuantityTypeIdentifier, unit: HKUnit, from start: Date) async throws -> Double {
        let type = HKQuantityType(id)
        let descriptor = HKStatisticsQueryDescriptor(
            predicate: .quantitySample(type: type, predicate: HKQuery.predicateForSamples(withStart: start, end: nil)),
            options: .cumulativeSum)
        let statistics = try await descriptor.result(for: store)
        return statistics?.sumQuantity()?.doubleValue(for: unit) ?? 0
    }

    /// Promenader som registrerats som träningspass (t.ex. med Apple Watch eller Fitness).
    private func recentWalks(since start: Date) async throws -> [WalkSummary] {
        let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
            HKQuery.predicateForWorkouts(with: .walking),
            HKQuery.predicateForSamples(withStart: start, end: nil)
        ])
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.workout(predicate)],
            sortDescriptors: [SortDescriptor(\.endDate, order: .reverse)],
            limit: 20)
        let workouts = try await descriptor.result(for: store)
        let distanceType = HKQuantityType(.distanceWalkingRunning)
        return workouts.map { workout in
            WalkSummary(
                id: workout.uuid,
                start: workout.startDate,
                duration: workout.duration,
                distanceKm: workout.statistics(for: distanceType)?.sumQuantity()?.doubleValue(for: .meterUnit(with: .kilo)))
        }
    }
}
