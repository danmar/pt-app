import SwiftUI
import SwiftData

@main
struct PTApp: App {
    @State private var health = HealthManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(health)
        }
        .modelContainer(for: WorkoutSession.self)
    }
}
