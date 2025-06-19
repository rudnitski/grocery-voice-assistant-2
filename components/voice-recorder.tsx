"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import ExportDialog from "./export-dialog"
import { formatGroceryListForExport } from "@/lib/utils/grocery-utils"
import { toast } from "@/hooks/use-toast"
import TranscriptPanel from "./transcript-panel"
import GroceryList from "./grocery-list"
import UsualGroceries from "./usual-groceries"
import { mockTranscript, mockGroceryItems } from "@/lib/mock-data"
import { processTranscriptClient, transcribeAudio } from "@/lib/services/openai-service"
import { Measurement } from "@/lib/types/grocery-types"
import { Card } from "./ui/card"
import { Separator } from "./ui/separator"

// Audio recording interfaces
interface AudioRecorderState {
  recording: boolean;
  audioBlob: Blob | null;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  streamingMode: boolean;
}

// Feature detection for browser capabilities
const detectFeatures = () => {
  // Check if MediaRecorder is supported and what formats it handles
  const supportsMediaRecorder = !!(typeof window !== 'undefined' && 
    navigator.mediaDevices &&
    window.MediaRecorder &&
    (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ||
     MediaRecorder.isTypeSupported('audio/mp4'))
  );

  // Check if WebSockets are supported for realtime API
  const supportsRealtime = !!(typeof window !== 'undefined' && window.WebSocket);

  // Determine preferred MIME type based on browser support
  let preferredMimeType = '';
  if (typeof window !== 'undefined' && window.MediaRecorder) {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      preferredMimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      preferredMimeType = 'audio/mp4';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      preferredMimeType = 'audio/webm';
    }
  }

  return { supportsMediaRecorder, supportsRealtime, preferredMimeType };
};

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("") // Stores the last successfully processed transcript (voice or manual)
  const [manualTranscript, setManualTranscript] = useState("") // Live text in the editable textarea for manual input/editing
  const [interimTranscript, setInterimTranscript] = useState("")
  const [groceryItems, setGroceryItems] = useState<Array<{ id: string; name: string; quantity: number; measurement?: Measurement }>>([])
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportText, setExportText] = useState("")  
  const [useMockData, setUseMockData] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [usualGroceries, setUsualGroceries] = useState("")
  const [rawJsonResponse, setRawJsonResponse] = useState<string>("") // Store the raw JSON response from OpenAI
  
  // Feature detection state
  const [browserFeatures, setBrowserFeatures] = useState({
    supportsMediaRecorder: false,
    supportsRealtime: false,
    preferredMimeType: ''
  });
  
  // Audio recording state
  const [audioState, setAudioState] = useState<AudioRecorderState>({
    recording: false,
    audioBlob: null,
    mediaRecorder: null,
    audioChunks: [],
    streamingMode: false
  })
  
  // Stream reference and socket reference
  const streamRef = useRef<MediaStream | null>(null)
  const socketRef = useRef<WebSocket | null>(null)

  // Internal core function to process text from any source
  const _processTextInternal = async (textToProcess: string) => {
    setErrorMessage(null);
    setIsProcessing(true);

    if (useMockData) {
      setGroceryItems(mockGroceryItems);
      setRawJsonResponse(JSON.stringify({ items: mockGroceryItems, transcript: mockTranscript }, null, 2));
      setIsProcessing(false);
      return;
    }

    try {
      const { items: _, rawResponse } = await processTranscriptClient(textToProcess, usualGroceries); // We'll use rawResponse primarily
    
    let itemsToProcessFromAI = [];
    if (rawResponse) {
      try {
        const parsedRaw = JSON.parse(rawResponse);
        if (parsedRaw && Array.isArray(parsedRaw.items)) {
          itemsToProcessFromAI = parsedRaw.items;
        }
      } catch (e) {
        console.error('Failed to parse rawResponse:', e);
        // Potentially fall back to extractedItems if parsing fails, or handle error
      }
    }
    console.log('[DEBUG] Items to process from AI (from rawResponse):', JSON.stringify(itemsToProcessFromAI, null, 2));

    setGroceryItems(prevItems => {
      let updatedItems = [...prevItems];
      for (const extractedItem of itemsToProcessFromAI) { // Iterate over items from rawResponse
          const incomingItemNameStr = (extractedItem as any).item || ''; // Use .item as per rawResponse structure
          const incomingItemNameLowerCase = incomingItemNameStr.toLowerCase();
          const incomingItemQuantity = typeof (extractedItem as any).quantity === 'number' ? (extractedItem as any).quantity : 0;
          const action = (extractedItem as any).action || 'add';
          const measurement = (extractedItem as any).measurement || null;
          const itemIndex = updatedItems.findIndex(stateItem => stateItem.name.toLowerCase() === incomingItemNameLowerCase);
          switch (action) {
            case 'add':
              if (itemIndex > -1) {
                updatedItems[itemIndex].quantity += incomingItemQuantity;
                // Update measurement if provided
                if (measurement) {
                  updatedItems[itemIndex].measurement = measurement;
                }
              } else if (incomingItemNameStr) {
                const newItem = { 
                  id: String(Date.now() + Math.random()), 
                  name: incomingItemNameStr, 
                  quantity: incomingItemQuantity
                };
                if (measurement) {
                  (newItem as any).measurement = measurement;
                }
                updatedItems.push(newItem);
              }
              break;
            case 'remove':
              if (itemIndex > -1) updatedItems.splice(itemIndex, 1);
              break;
            case 'modify':
              if (itemIndex > -1) {
                updatedItems[itemIndex].quantity = incomingItemQuantity;
                // Update measurement if provided
                if (measurement) {
                  updatedItems[itemIndex].measurement = measurement;
                }
              } else if (incomingItemNameStr) {
                const newItem = { 
                  id: String(Date.now() + Math.random()), 
                  name: incomingItemNameStr, 
                  quantity: incomingItemQuantity
                };
                if (measurement) {
                  (newItem as any).measurement = measurement;
                }
                updatedItems.push(newItem);
              }
              break;
            default:
              if (incomingItemNameStr) console.warn(`Unknown action: ${action} for item: ${incomingItemNameStr}`);
          }
        }
        const newGroceryList = updatedItems.filter(item => item.quantity > 0);
        console.log('[DEBUG] New grocery list to be set:', JSON.stringify(newGroceryList, null, 2));
        return newGroceryList;
      });
      if (rawResponse) {
        setRawJsonResponse(typeof rawResponse === 'string' ? rawResponse : JSON.stringify(rawResponse, null, 2));
      }
      setErrorMessage(null); // Clear error on success
    } catch (error) {
      console.error('Error processing transcript:', error);
      setErrorMessage(`Error processing transcript: ${error instanceof Error ? error.message : String(error)}`);
      // Fallback logic from original code
      const items = textToProcess.split(/,|and/).map((item, index) => {
        const trimmed = item.trim(); let bestMatch = trimmed.toLowerCase();
        if (usualGroceries) {
          const usualItems = usualGroceries.split('\n').map(i => i.trim().toLowerCase());
          const possibleMatches = usualItems.filter(usual => usual.includes(bestMatch) || bestMatch.includes(usual));
          if (possibleMatches.length > 0) bestMatch = possibleMatches.sort((a, b) => Math.abs(a.length - bestMatch.length) - Math.abs(b.length - bestMatch.length))[0];
        }
        return { id: String(index + 1), name: bestMatch, quantity: 1 };
      }).filter(item => item.name.length > 0);
      setGroceryItems(items);
      setRawJsonResponse("");
    } finally {
      setIsProcessing(false);
    }
  };

  // Process transcript from voice input
  const processTranscript = async (text: string) => {
    setTranscript(text); // Update the main transcript state (last successfully processed from voice)
    setManualTranscript(text); // Also set the manual transcript to allow immediate editing of voice results
    await _processTextInternal(text);
  };

  // Process transcript from manual text input area
  const handleProcessManualTranscript = async () => {
    if (!manualTranscript.trim()) return; // Do nothing if textarea is empty
    setTranscript(manualTranscript); // Update main transcript to reflect what's being processed
    await _processTextInternal(manualTranscript);
  };

  // Export grocery list handler
  const handleExportList = async () => {
    if (groceryItems.length === 0) return;
    const formatted = formatGroceryListForExport(
      groceryItems.map(({ name, quantity, measurement }) => ({ item: name, quantity, measurement })) as any
    );
    try {
      await navigator.clipboard.writeText(formatted);
      toast({ title: "Copied!", description: "Grocery list copied to clipboard." });
    } catch (err) {
      setExportText(formatted);
      setIsExportDialogOpen(true);
    }
  };

  // Handler for when usual groceries change
  const handleUsualGroceriesChange = (groceries: string) => {
    setUsualGroceries(groceries)
  }

  // Initialize feature detection on mount
  useEffect(() => {
    const features = detectFeatures();
    setBrowserFeatures(features);
    console.log('Browser feature detection:', features);
  }, []);
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Stop any active stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      // Close any open WebSocket connection
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }
    }
  }, [])

  // Start Whisper-based recording (file upload approach)
  const startWhisperRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Use the preferred MIME type detected for this browser
      const mimeType = browserFeatures.preferredMimeType || 'audio/webm'
      
      // Create a new MediaRecorder instance with the preferred format
      const mediaRecorder = new MediaRecorder(stream, 
        mimeType ? { mimeType } : undefined
      )
      const audioChunks: Blob[] = []
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // Create a blob from the audio chunks with the correct MIME type
        const audioBlob = new Blob(audioChunks, { type: mimeType })
        
        // Update state with the recorded audio
        setAudioState(prev => ({
          ...prev,
          recording: false,
          audioBlob,
          audioChunks: [],
          streamingMode: false
        }))
        
        // Process the audio using Whisper API
        await processRecordedAudio(audioBlob)
      }
      
      // Request data every 300ms for WebKit browsers that need smaller chunks
      const timeslice = mimeType.includes('mp4') ? 300 : undefined
      mediaRecorder.start(timeslice)
      
      // Update state
      setAudioState({
        recording: true,
        audioBlob: null,
        mediaRecorder,
        audioChunks,
        streamingMode: false
      })
      
      setIsRecording(true)
      console.log(`Started recording using Whisper approach with format: ${mimeType}`)
    } catch (error) {
      console.error("Error starting Whisper recording:", error)
      handleRecordingError(error)
    }
  }
  
  // Start GPT-4o Realtime streaming recording
  const startRealtimeRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Clear previous transcripts
      setTranscript("")
      setInterimTranscript("")
      
      // Create AudioContext for processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = audioContext.createMediaStreamSource(stream)
      const processor = audioContext.createScriptProcessor(4096, 1, 1)
      
      // Connect the audio processor
      source.connect(processor)
      processor.connect(audioContext.destination)
      
      // Create a WebSocket connection to the GPT-4o Realtime API
      // Note: In a real implementation, this would connect to your backend which handles the OpenAI API auth
      const socket = new WebSocket('wss://api.openai.com/v1/audio/speech')
      socketRef.current = socket
      
      // Set up WebSocket event handlers
      socket.onopen = () => {
        console.log('WebSocket connection established for realtime transcription')
        
        // Send initial configuration message
        socket.send(JSON.stringify({
          type: 'config',
          model: 'gpt-4o',
          language: 'en',
          // Include any other required configuration
        }))
      }
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          // Handle different message types from the API
          if (data.type === 'transcript') {
            // If it's a final transcript, add it to the main transcript
            if (data.is_final) {
              setTranscript(prev => prev + ' ' + data.text.trim())
              setInterimTranscript('')
            } else {
              // Otherwise, show it as interim transcript
              setInterimTranscript(data.text.trim())
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
        handleRecordingError(error)
      }
      
      socket.onclose = () => {
        console.log('WebSocket connection closed')
        // Clean up the audio processing
        if (processor && source) {
          source.disconnect()
          processor.disconnect()
        }
      }
      
      // Set up the audio processor to send audio data
      processor.onaudioprocess = (e) => {
        // Only send audio data if the WebSocket is open
        if (socket.readyState === WebSocket.OPEN) {
          // Get the audio data from the input channel
          const inputData = e.inputBuffer.getChannelData(0)
          
          // Convert the float32 audio data to Int16 for transmission
          const int16Array = new Int16Array(inputData.length)
          for (let i = 0; i < inputData.length; i++) {
            // Convert Float32 to Int16
            int16Array[i] = Math.min(1, Math.max(-1, inputData[i])) * 32767
          }
          
          // Send the audio data as a binary message
          socket.send(int16Array.buffer)
        }
      }
      
      // Update state
      setAudioState({
        recording: true,
        audioBlob: null,
        mediaRecorder: null,
        audioChunks: [],
        streamingMode: true
      })
      
      setIsRecording(true)
      console.log('Started recording using GPT-4o Realtime streaming approach')
    } catch (error) {
      console.error("Error starting Realtime recording:", error)
      handleRecordingError(error)
    }
  }
  
  // Handle recording errors
  const handleRecordingError = (error: any) => {
    console.error('Recording error:', error)
    
    // Reset recording state
    setIsRecording(false)
    setIsProcessing(false)
    
    // Show appropriate error message
    setErrorMessage("Could not access microphone. Please check permissions and try again.")
  }
  
  // Combined start recording function that selects the appropriate approach
  const startRecording = async () => {
    setManualTranscript(""); // Clear manual transcript when starting voice recording
    setErrorMessage(null);    // Clear any existing error messages
    try {
      // Clear previous state
      setErrorMessage(null)
      setTranscript("")
      setInterimTranscript("")
      setGroceryItems([])
      
      // If we're using mock data, just simulate recording
      if (useMockData) {
        setIsRecording(true)
        
        // Simulate recording for 2 seconds
        setTimeout(() => {
          setIsRecording(false)
          setTranscript(mockTranscript)
          setGroceryItems(mockGroceryItems)
        }, 2000)
        
        return
      }
      
      // First try Whisper approach if MediaRecorder is supported
      if (browserFeatures.supportsMediaRecorder) {
        await startWhisperRecording()
      }
      // Fall back to GPT-4o Realtime API if WebSockets are supported
      else if (browserFeatures.supportsRealtime) {
        await startRealtimeRecording()
      }
      // No valid recording method available
      else {
        setErrorMessage("Your browser doesn't support voice recording. Please try a different browser.")
      }
    } catch (error) {
      console.error("Error starting recording:", error)
      handleRecordingError(error)
    }
  }
  
  // Stop recording function
  const stopRecording = () => {
    // Handle Whisper API approach
    if (audioState.mediaRecorder && audioState.recording) {
      // Stop the media recorder
      audioState.mediaRecorder.stop()
    }
    
    // Handle GPT-4o Realtime approach
    if (audioState.streamingMode && socketRef.current) {
      // Send a close message if needed by the API
      if (socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'close' }))
      }
      
      // Close the WebSocket connection
      socketRef.current.close()
      socketRef.current = null
      
      // Process the current transcript as the final result
      if (transcript) {
        console.log('Processing final streaming transcript')
        processTranscript(transcript)
      }
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    setIsRecording(false)
    console.log('Recording stopped')
  }
  
  // Process the recorded audio using OpenAI's transcription API (Whisper)
  const processRecordedAudio = async (audioBlob: Blob) => {
    if (!audioBlob) {
      setErrorMessage("No audio recorded. Please try again.")
      return
    }
    
    try {
      setIsProcessing(true)
      
      // Transcribe the audio using our OpenAI Whisper service
      const result = await transcribeAudio(audioBlob)
      
      if (result) {
        console.log('Audio transcribed with Whisper:', result)
        setTranscript(result)
        // Process the transcript to extract grocery items
        await processTranscript(result)
      } else {
        setErrorMessage("Couldn't transcribe audio. Please try again.")
      }
    } catch (err) {
      console.error("Error processing audio with Whisper API:", err)
      setErrorMessage("Error processing audio. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }
  
  const toggleRecording = () => {
    if (!isRecording) {
      startRecording()
    } else {
      stopRecording()
    }
  }
  
  const toggleMockData = (e: React.MouseEvent) => {
    e.preventDefault()
    setUseMockData(!useMockData)
    
    if (!isRecording && !useMockData) {
      setTranscript(mockTranscript)
      setGroceryItems(mockGroceryItems)
    } else if (!isRecording && useMockData) {
      setTranscript("")
      setGroceryItems([])
    }
  }
  
  const updateItemQuantity = (itemId: string, changeAmount: number) => {
    setGroceryItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + changeAmount) } : item))
    )
  }
  
  // Determine the recording mode display text
  const getRecordingModeText = () => {
    if (!browserFeatures.supportsMediaRecorder && !browserFeatures.supportsRealtime) {
      return "Voice recording not supported in this browser"
    }
    
    if (audioState.streamingMode) {
      return "Using GPT-4o Realtime API (streaming mode)"
    }
    
    if (browserFeatures.supportsMediaRecorder) {
      return `Using Whisper API (${browserFeatures.preferredMimeType || 'audio/webm'})`
    }
    
    return "Ready to record"
  }
  
  return (
    <div className="flex flex-col items-center w-full">
      <header className="flex items-center justify-center gap-3 mb-12 pt-8">
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-3 rounded-2xl shadow-lg">
          <Mic className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Grocery Voice Assistant</h1>
      </header>

      <div className="w-full max-w-md mb-8">
        {/* Recording mode indicator */}
        <div className="text-sm text-center text-gray-500 mb-2">
          {getRecordingModeText()}
        </div>
        
        <button
          onClick={toggleRecording}
          disabled={isProcessing || (!browserFeatures.supportsMediaRecorder && !browserFeatures.supportsRealtime && !useMockData)}
          className={`
            w-full py-5 text-lg font-medium rounded-2xl shadow-lg 
            transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
            focus:outline-none focus:ring-4 focus:ring-opacity-50
            ${isProcessing ? "bg-gray-400 cursor-not-allowed" : isRecording 
              ? "bg-gradient-to-r from-rose-500 to-pink-500 focus:ring-rose-500/30" 
              : "bg-gradient-to-r from-pink-500 to-rose-500 focus:ring-pink-500/30"
            }
          `}
          aria-pressed={isRecording}
        >
          <span className="flex items-center justify-center gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : isRecording ? (
              <>
                <Square className="w-5 h-5" />
                <span>Stop & Transcribe</span>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <span>Start Recording</span>
              </>
            )}
          </span>
        </button>
        
        <div className="text-sm text-center">
          {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
        </div>
        
        {isProcessing && (
          <div className="text-sm text-center animate-pulse mt-2">
            Processing your voice...
          </div>
        )}
        
        {errorMessage && (
          <div className="p-3 text-sm bg-red-100 border border-red-300 text-red-800 rounded-md mt-2">
            {errorMessage}
          </div>
        )}

        {/* Toggle for mock data in development */}
        <div className="flex items-center space-x-2 text-sm mt-2">
          <input 
            type="checkbox" 
            id="mock-data" 
            checked={useMockData} 
            onChange={() => setUseMockData(!useMockData)}
            className="h-4 w-4 text-pink-600"
          />
          <label htmlFor="mock-data" className="text-gray-700">
            Use mock data (for development only)
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-8">
        <div className="flex flex-col space-y-4">
          <TranscriptPanel 
            transcript={manualTranscript} 
            onTranscriptChange={setManualTranscript} 
            onProcessText={handleProcessManualTranscript} 
            isProcessing={isProcessing} 
          />
          
          {/* Show interim transcript for streaming mode */}
          {interimTranscript && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 italic">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">Streaming transcript:</div>
              {interimTranscript}...
            </div>
          )}
          
          {/* Show transcription mode badge */}
          {isRecording && audioState.streamingMode && (
            <div className="inline-flex items-center self-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
              <div className="mr-1.5 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              Live streaming
            </div>
          )}
        </div>
        
        <GroceryList items={groceryItems} updateQuantity={updateItemQuantity} onExport={handleExportList} />
      </div>
      
      {/* Raw JSON Response Section */}
      {rawJsonResponse && (
        <Card className="w-full mb-8 overflow-hidden">
          <div className="p-4 bg-gray-100">
            <h3 className="text-lg font-medium mb-2">Raw JSON Response</h3>
            <Separator className="mb-3" />
            <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-x-auto text-sm">
              {rawJsonResponse}
            </pre>
          </div>
        </Card>
      )}
      
      {/* Export fallback dialog */}
      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        textToCopy={exportText}
      />

      {/* Usual groceries textarea */}
      <UsualGroceries onUsualGroceriesChange={handleUsualGroceriesChange} />
    </div>
  )
}
