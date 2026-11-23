import SwiftUI

struct SettingsView: View {
    @Environment(HealthManager.self) private var health
    @Environment(\.dismiss) private var dismiss
    @AppStorage("stepGoal") private var stepGoal = 8000
    @AppStorage("hasDumbbells") private var hasDumbbells = false
    @AppStorage("saveToHealth") private var saveToHealth = true
    @AppStorage("restSeconds") private var restSeconds = 90

    var body: some View {
        NavigationStack {
            Form {
                Section("Dagligt stegmål") {
                    Stepper("\(stepGoal.formatted()) steg", value: $stepGoal, in: 2000...30000, step: 500)
                }

                Section {
                    Toggle("Jag har hantlar hemma", isOn: $hasDumbbells)
                } header: {
                    Text("Hemmaträning")
                } footer: {
                    Text("Med hantlar får du fler övningsförslag hemma.")
                }

                Section("Träningspass") {
                    Stepper("Vila mellan set: \(restSeconds) s", value: $restSeconds, in: 30...300, step: 15)
                    Toggle("Spara pass i Apple Hälsa", isOn: $saveToHealth)
                }

                Section {
                    Button("Ge åtkomst till Apple Hälsa") {
                        Task {
                            await health.requestAuthorization()
                            await health.refresh()
                        }
                    }
                } header: {
                    Text("Apple Hälsa")
                } footer: {
                    Text("Har du nekat tidigare? Ändra under Inställningar › Hälsa › Dataåtkomst och enheter › Min PT.")
                }
            }
            .navigationTitle("Inställningar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Klar") { dismiss() }
                }
            }
        }
    }
}
