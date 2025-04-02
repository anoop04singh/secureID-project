"use client"

import { useState, useEffect } from "react"
import { Loader2 } from 'lucide-react'
import dynamic from "next/dynamic"

// Dynamically import the LivenessDetection component with no SSR
const LivenessDetection = dynamic(
  () => import("./liveness-detection").then((mod) => mod.LivenessDetection),
  { 
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-center">Loading liveness detection...</p>
      </div>
    )
  }
)

interface ClientOnlyLivenessProps {
  onComplete: (success: boolean) => void
  isProcessing?: boolean
}

export function ClientOnlyLiveness({ onComplete, isProcessing = false }: ClientOnlyLivenessProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-center">Initializing liveness detection...</p>
      </div>
    )
  }

  return <LivenessDetection onComplete={onComplete} isProcessing={isProcessing} />
}
