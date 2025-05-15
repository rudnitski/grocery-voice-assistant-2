"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Mic, Square } from "lucide-react"
import TranscriptPanel from "./transcript-panel"
import GroceryList from "./grocery-list"
import { mockTranscript, mockGroceryItems } from "@/lib/mock-data"
import { processTranscriptClient } from "@/lib/services/openai-service"

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [groceryItems, setGroceryItems] = useState<Array<{ id: string; name: string; quantity: number }>>([])  
  const [useMockData, setUseMockData] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

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

  const startRecording = () => {
    // Clear any previous error messages and data
    setErrorMessage(null)
    setTranscript("")
    setGroceryItems([])
    
    // If there's an existing recognition instance, stop it first
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    
    // If using mock data, don't start real speech recognition
    if (useMockData) {
      setIsRecording(true)
      return
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognition) {
      setErrorMessage("Speech Recognition not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Get the last result (most recent)
      const lastResultIndex = event.results.length - 1
      const transcript = event.results[lastResultIndex][0].transcript
      console.log('Speech recognized:', transcript)
      processTranscript(transcript)
      setIsRecording(false)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error)
      
      // Handle specific error types
      if (event.error === 'not-allowed') {
        setErrorMessage("Microphone permission denied. Please allow microphone access in your browser settings and try again.")
      } else if (event.error === 'no-speech') {
        setErrorMessage("No speech detected. Please try again.")
      } else if (event.error === 'network') {
        setErrorMessage("Network error occurred. Please check your connection and try again.")
      } else if (event.error === 'aborted') {
        setErrorMessage("Speech recognition was aborted.")
      } else {
        setErrorMessage(`Speech recognition error: ${event.error}. This may not work in preview windows - try running the app locally.`)
      }
      
      setIsRecording(false)
    }

    recognition.onend = () => setIsRecording(false)

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      setErrorMessage("Failed to start speech recognition. This feature may not be available in this environment.")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    
    // If using mock data, use it when stopping
    if (useMockData) {
      setTranscript(mockTranscript)
      processTranscript(mockTranscript)
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
      prevItems.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item)),
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
          className={`
            w-full py-5 text-lg font-medium rounded-2xl shadow-lg 
            transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
            focus:outline-none focus:ring-4 focus:ring-opacity-50
            ${
              isRecording
                ? "bg-gradient-to-r from-rose-500 to-pink-500 focus:ring-rose-500/30"
                : "bg-gradient-to-r from-pink-500 to-rose-500 focus:ring-pink-500/30"
            }
          `}
          aria-pressed={isRecording}
        >
          <span className="flex items-center justify-center gap-2">
            {isRecording ? (
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
            {errorMessage.includes('preview window') && (
              <p className="mt-2 font-semibold">
                For testing purposes, you can use the mock data option instead.
              </p>
            )}
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
