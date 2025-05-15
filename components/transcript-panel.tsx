export default function TranscriptPanel({ transcript }: { transcript: string }) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 px-1">Transcript</h2>
      <div
        className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-800 min-h-[250px] flex-grow"
        aria-live="polite"
      >
        {transcript ? (
          <p className="text-gray-300 leading-relaxed">{transcript}</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 italic">Your speech transcript will appear here...</p>
            <p className="text-gray-600 text-sm mt-2">Press the recording button to start</p>
          </div>
        )}
      </div>
    </div>
  )
}
