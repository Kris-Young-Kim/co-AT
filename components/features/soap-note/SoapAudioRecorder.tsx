"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"

interface SoapAudioRecorderProps {
  onTranscript?: (text: string) => void
  onRecordingChange?: (isRecording: boolean) => void
}

/**
 * 음성 녹음 컴포넌트 (Web Speech API 사용)
 */
export function SoapAudioRecorder({
  onTranscript,
  onRecordingChange,
}: SoapAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Web Speech API 지원 여부 확인
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      setIsSupported(true)
      recognitionRef.current = new SpeechRecognition()
      const recognition = recognitionRef.current

      // 한국어 설정
      recognition.lang = "ko-KR"
      recognition.continuous = true // 연속 인식
      recognition.interimResults = true // 중간 결과도 받기

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }

        if (onTranscript) {
          onTranscript(transcript)
        }
      }

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("[SoapAudioRecorder] 음성 인식 오류:", event.error)
        setIsRecording(false)
        if (onRecordingChange) {
          onRecordingChange(false)
        }
      }

      recognition.onend = () => {
        setIsRecording(false)
        if (onRecordingChange) {
          onRecordingChange(false)
        }
      }
    } else {
      setIsSupported(false)
      console.warn("[SoapAudioRecorder] Web Speech API를 지원하지 않는 브라우저입니다")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript, onRecordingChange])

  const startRecording = () => {
    if (!recognitionRef.current || !isSupported) {
      return
    }

    try {
      console.log("[SoapAudioRecorder] 녹음 시작")
      recognitionRef.current.start()
      setIsRecording(true)
      if (onRecordingChange) {
        onRecordingChange(true)
      }
    } catch (error) {
      console.error("[SoapAudioRecorder] 녹음 시작 실패:", error)
    }
  }

  const stopRecording = () => {
    if (!recognitionRef.current) {
      return
    }

    try {
      console.log("[SoapAudioRecorder] 녹음 중지")
      recognitionRef.current.stop()
      setIsRecording(false)
      if (onRecordingChange) {
        onRecordingChange(false)
      }
    } catch (error) {
      console.error("[SoapAudioRecorder] 녹음 중지 실패:", error)
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        이 브라우저는 음성 인식을 지원하지 않습니다.
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <Button
          type="button"
          variant="destructive"
          onClick={stopRecording}
          disabled={isProcessing}
        >
          <Square className="h-4 w-4 mr-2" />
          녹음 중지
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          disabled={isProcessing}
        >
          <Mic className="h-4 w-4 mr-2" />
          음성 녹음 시작
        </Button>
      )}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          녹음 중...
        </div>
      )}
    </div>
  )
}

// Web Speech API 타입 정의
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionErrorEvent {
  error: string
  message: string
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
