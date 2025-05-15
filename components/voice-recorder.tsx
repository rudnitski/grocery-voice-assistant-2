"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Mic, Square } from "lucide-react"
import TranscriptPanel from "./transcript-panel"
import GroceryList from "./grocery-list"
import { mockTranscript, mockGroceryItems } from "@/lib/mock-data"
import { processTranscriptClient, transcribeAudio } from "@/lib/services/openai-service"

// Audio recording interfaces
interface AudioRecorderState {
  recording: boolean;
  audioBlob: Blob | null;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
}

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [groceryItems, setGroceryItems] = useState<Array<{ id: string; name: string; quantity: number }>>([])  
  const [useMockData, setUseMockData] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Audio recording state
  const [audioState, setAudioState] = useState<AudioRecorderState>({
    recording: false,
    audioBlob: null,
    mediaRecorder: null,
    audioChunks: []
  })
  
  // Stream reference
  const streamRef = useRef<MediaStream | null>(null)

  // Process transcript to extract grocery items using our service
  const processTranscript = async (text: string) => {
    setTranscript(text)
    
    if (useMockData) {
      // Use mock data directly if enabled
      setGroceryItems(mockGroceryItems)
      return
    }
    
    try {
      // Use our service to process the transcript
      const items = await processTranscriptClient(text)
      setGroceryItems(items)
    } catch (error) {
      console.error('Error processing transcript:', error)
      // Fallback to simple parsing if API call fails
      const items = text.split(/,|and/).map((item, index) => {
        const trimmed = item.trim()
        return {
          id: String(index + 1),
          name: trimmed.toLowerCase(),
          quantity: 1
        }
      }).filter(item => item.name.length > 0)
      
      setGroceryItems(items)
    }
  }

  // Clean up media stream when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const startRecording = async () => {
    // Clear any previous error messages and data
    setErrorMessage(null)
    setTranscript("")
    setGroceryItems([])
    
    // If using mock data, don't start real recording
    if (useMockData) {
      setIsRecording(true)
      return
    }
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: Blob[] = []
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        
        // Update state with the recorded audio
        setAudioState(prev => ({
          ...prev,
          recording: false,
          audioBlob,
          audioChunks: []
        }))
        
        // Process the audio
        await processRecordedAudio(audioBlob)
      }
      
      // Start recording
      mediaRecorder.start()
      
      // Update state
      setAudioState({
        recording: true,
        audioBlob: null,
        mediaRecorder,
        audioChunks
      })
      
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting audio recording:", error)
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setErrorMessage("Microphone permission denied. Please allow microphone access in your browser settings and try again.")
      } else {
        setErrorMessage("Failed to start audio recording. This feature may not be available in this environment.")
      }
      
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    // If using mock data, use it when stopping
    if (useMockData) {
      setTranscript(mockTranscript)
      processTranscript(mockTranscript)
      setIsRecording(false)
      return
    }
    
    // Stop the media recorder if it exists
    if (audioState.mediaRecorder && audioState.recording) {
      audioState.mediaRecorder.stop()
      
      // Stop all tracks in the stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
    
    setIsRecording(false)
  }
  
  // Process the recorded audio using OpenAI's transcription API
  const processRecordedAudio = async (audioBlob: Blob) => {
    if (!audioBlob) {
      setErrorMessage("No audio recorded. Please try again.")
      return
    }
    
    try {
      setIsProcessing(true)
      
      // Transcribe the audio using our OpenAI service
      const transcribedText = await transcribeAudio(audioBlob)
      
      if (transcribedText) {
        console.log('Audio transcribed:', transcribedText)
        // Process the transcript to extract grocery items
        await processTranscript(transcribedText)
      } else {
        setErrorMessage("Couldn't transcribe audio. Please try again.")
      }
    } catch (error) {
      console.error("Error processing audio:", error)
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

  const updateItemQuantity = (id: string, change: number) => {
    setGroceryItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item))
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      <header className="flex items-center justify-center gap-3 mb-12 pt-8">
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-3 rounded-2xl shadow-lg">
          <Mic className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">Grocery Voice Assistant</h1>
      </header>

      <div className="w-full max-w-md mb-12">
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
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
                <span className="animate-pulse">Processing with GPT-4o mini...</span>
              </>
            ) : isRecording ? (
              <>
                <Square className="w-5 h-5" />
                Stop & Transcribe
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                Start Recording
              </>
            )}
          </span>
        </button>

        <button
          onClick={toggleMockData}
          className="mt-4 mx-auto block text-sm text-gray-400 hover:text-pink-400 transition-colors underline focus:outline-none focus:ring-2 focus:ring-pink-400 rounded-md px-2 py-1"
        >
          {useMockData ? "Disable mock data" : "Use mock data for testing"}
        </button>
        
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-900/50 text-red-300 rounded-xl max-w-md text-sm border border-red-800">
            <p>{errorMessage}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <TranscriptPanel transcript={transcript} />
        <GroceryList items={groceryItems} updateQuantity={updateItemQuantity} />
      </div>
    </div>
  )
}
