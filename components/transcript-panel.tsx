import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

interface TranscriptPanelProps {
  transcript: string;
  onTranscriptChange: (newTranscript: string) => void;
  onProcessText: () => Promise<void>;
  isProcessing: boolean;
  placeholder?: string;
}

export default function TranscriptPanel({ 
  transcript, 
  onTranscriptChange, 
  onProcessText, 
  isProcessing, 
  placeholder = "Your speech transcript will appear here...\nPress the recording button to start, or type here and press 'Process Text'."
}: TranscriptPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-semibold mb-4 px-1">Transcript</h2>
      <div
        className="bg-gray-900/50 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-800 min-h-[250px] flex-grow"
        aria-live="polite"
      >
        <Textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder={placeholder}
          className="bg-gray-800 border-gray-700 text-gray-300 leading-relaxed flex-grow resize-none min-h-[180px] focus:ring-sky-500 focus:border-sky-500"
          maxLength={5000}
          aria-label="Transcript input"
        />
        <Button 
          onClick={onProcessText} 
          disabled={isProcessing || !transcript.trim()}
          className="mt-4 w-full bg-sky-600 hover:bg-sky-700 disabled:opacity-50 flex items-center justify-center"
        >
          {isProcessing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
          ) : (
            "Process Text"
          )}
        </Button>
      </div>
    </div>
  )
}
