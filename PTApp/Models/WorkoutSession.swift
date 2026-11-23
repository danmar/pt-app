import Foundation
import SwiftData

struct SetRecord: Codable, Hashable {
    var reps: Int
    var weight: Double
}

struct EntryRecord: Codable, Hashable {
    var exerciseID: String
    var sets: [SetRecord]

    var exercise: Exercise? { ExerciseLibrary.byID[exerciseID] }
}

@Model
final class WorkoutSession {
    var date: Date
    var endDate: Date
    var placeRaw: String
    var entries: [EntryRecord]

    init(date: Date, endDate: Date, place: Place, entries: [EntryRecord]) {
        self.date = date
        self.endDate = endDate
        self.placeRaw = place.rawValue
        self.entries = entries
    }

    var place: Place { Place(rawValue: placeRaw) ?? .gym }
    var duration: TimeInterval { endDate.timeIntervalSince(date) }
    var totalSets: Int { entries.reduce(0) { $0 + $1.sets.count } }
}
