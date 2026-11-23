import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            ActivityView()
                .tabItem { Label("Idag", systemImage: "figure.walk") }

            PlanView(place: .gym)
                .tabItem { Label("Gym", systemImage: "dumbbell") }

            PlanView(place: .home)
                .tabItem { Label("Hemma", systemImage: "house") }

            HistoryView()
                .tabItem { Label("Logg", systemImage: "list.bullet.clipboard") }
        }
    }
}
