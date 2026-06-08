'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Square } from 'lucide-react'

interface SpeechRecognitionAPI {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    length: number
    [i: number]: { isFinal: boolean; [i: number]: { transcript: string } }
  }
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionAPI
    webkitSpeechRecognition?: new () => SpeechRecognitionAPI
  }
}

interface SttRecorderProps {
  onTranscriptChange: (text: string) => void
  onRecordingStop?: (durationSec: number) => void
  disabled?: boolean
}

export function SttRecorder({ onTranscriptChange, onRecordingStop, disabled }: SttRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recognitionRef = useRef<SpeechRecognitionAPI | null>(null)
  const fullTextRef = useRef('')
  const startTimeRef = useRef<number>(0)

  const startRecording = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition!
    const recognition = new SpeechRecognition()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += text + ' '
        } else {
          interim += text
        }
      }
      if (final) {
        fullTextRef.current += final
      }
      onTranscriptChange(fullTextRef.current + interim)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000)
      onRecordingStop?.(durationSec)
    }

    recognitionRef.current = recognition
    fullTextRef.current = ''
    startTimeRef.current = Date.now()
    recognition.start()
    setIsRecording(true)
  }, [isSupported, onTranscriptChange, onRecordingStop])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  if (!isSupported) {
    return (
      <p className="text-xs text-gray-400">
        이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
        >
          <Square className="h-4 w-4" />
          녹음 중지
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Mic className="h-4 w-4" />
          녹음 시작
        </button>
      )}
      {isRecording && (
        <span className="flex items-center gap-1 text-sm text-red-600">
          <MicOff className="h-3 w-3 animate-pulse" />
          녹취 중
        </span>
      )}
    </div>
  )
}
