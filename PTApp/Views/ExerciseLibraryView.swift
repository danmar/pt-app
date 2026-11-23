import SwiftUI

struct ExerciseLibraryView: View {
    let place: Place
    @AppStorage("hasDumbbells") private var hasDumbbells = false
    @State private var search = ""

    private var filtered: [Exercise] {
        ExerciseLibrary.all.filter {
            $0.isAvailable(at: place, hasDumbbells: hasDumbbells)
                && (search.isEmpty || $0.name.localizedCaseInsensitiveContains(search))
        }
    }

    var body: some View {
        List {
            ForEach(MuscleGroup.allCases) { group in
                let items = filtered.filter { $0.primary == group }
                if !items.isEmpty {
                    Section(group.name) {
                        ForEach(items) { exercise in
                            NavigationLink(value: exercise) {
                                ExerciseRow(exercise: exercise)
                            }
                        }
                    }
                }
            }
        }
        .searchable(text: $search, prompt: "Sök övning")
        .navigationTitle("Övningar – \(place.name.lowercased())")
        .navigationBarTitleDisplayMode(.inline)
    }
}
