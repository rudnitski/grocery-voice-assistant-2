import VoiceRecorder from "@/components/voice-recorder"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Grocery Voice Assistant",
  description: "Record your grocery list using voice commands",
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-6 bg-gray-950 text-white">
      <div className="w-full max-w-5xl mx-auto">
        <VoiceRecorder />
      </div>
    </main>
  )
}
