"use client"

import React, { useEffect, useState } from "react"
import PaymentPanel from "./PaymentPanel"

type InlineItem = { tag?: string; quote?: string; comment?: string }
type StatusPayload = {
  submissionId: string
  status: "none" | "running" | "ready"
  isUnlocked?: boolean
  result?: {
    normalizedBody?: string
    globalComment?: string
    inline?: InlineItem[]
    score?: { overall?: number; out_of?: number }
  }
}

interface AnnotatedTeaserProps {
  submissionId: string
}

export default function AnnotatedTeaser({ submissionId }: AnnotatedTeaserProps) {
  const [payload, setPayload] = useState<StatusPayload>({ submissionId, status: "none" })
  const [isLoading, setIsLoading] = useState(true)
  
  // États pour le timer de génération
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(90) // 1:30 en secondes
  const [progressPercentage, setProgressPercentage] = useState(0)

  // Effet pour le timer en temps réel
  useEffect(() => {
    if (payload.status === "running" && !generationStartTime) {
      setGenerationStartTime(Date.now())
    }

    if (payload.status === "running" && generationStartTime) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - generationStartTime) / 1000
        const remaining = Math.max(0, 90 - elapsed)
        const progress = Math.min(100, (elapsed / 90) * 100)
        
        setEstimatedTimeRemaining(Math.ceil(remaining))
        setProgressPercentage(progress)
        
        if (remaining <= 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [payload.status, generationStartTime])

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/corrections/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissionId })
        })
        
        if (response.ok) {
          const data = await response.json()
          setPayload(data)
        }
      } catch (error) {
        console.error("Error polling status:", error)
      } finally {
        setIsLoading(false)
      }
    }

    pollStatus()
    const interval = setInterval(pollStatus, 3000)
    return () => clearInterval(interval)
  }, [submissionId])

  // Trigger generation if needed
  useEffect(() => {
    if (payload.status === "none") {
      fetch("/api/corrections/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId })
      })
    }
  }, [payload.status, submissionId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Interface de génération avec timer
  if (payload.status === "running") {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        <div className="text-center space-y-6">
          {/* Header avec titre */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Correction en cours de génération
            </h2>
            <p className="text-gray-600">
              Marie Terki analyse votre copie avec sa méthodologie experte
            </p>
          </div>

          {/* Spinner central avec timer */}
          <div className="relative inline-flex items-center justify-center">
            <svg 
              className="animate-spin -ml-1 mr-3 h-16 w-16 text-blue-600" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700">
                {formatTime(estimatedTimeRemaining)}
              </span>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progression</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Messages informatifs */}
          <div className="space-y-3 text-center">
            <p className="text-gray-700 font-medium">
              🔍 Analyse méthodologique en cours...
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 max-w-2xl mx-auto">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-blue-800">✅ Génération de 25-35 commentaires détaillés</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="font-medium text-green-800">🎯 Correction avec ton professoral rigoureux</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="font-medium text-purple-800">📝 Vérification méthodologie juridique</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="font-medium text-orange-800">💡 Conseils personnalisés d'amélioration</div>
              </div>
            </div>
          </div>

          {/* Estimation temps restant */}
          <div className="bg-gray-50 p-4 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Temps estimé restant :</span> {formatTime(estimatedTimeRemaining)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              La correction experte Marie Terki nécessite une analyse approfondie
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Interface de paiement si correction prête mais non déverrouillée
  if (payload.status === "ready" && !payload.isUnlocked) {
    return <PaymentPanel />
  }

  // Affichage de la correction complète
  if (payload.status === "ready" && payload.isUnlocked && payload.result) {
    const { normalizedBody, globalComment, inline, score } = payload.result

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white">
        {/* En-tête avec score */}
        {score && (
          <div className="mb-6 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
              <span className="text-lg font-bold text-blue-800">
                Note : {score.overall}/{score.out_of}
              </span>
            </div>
          </div>
        )}

        {/* Texte annoté */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Votre copie avec commentaires de Marie Terki
          </h3>
          <div className="prose max-w-none">
            <AnnotatedText text={normalizedBody || ""} comments={inline || []} />
          </div>
        </div>

        {/* Commentaire global */}
        {globalComment && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Commentaire général de Marie Terki
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="whitespace-pre-wrap text-gray-700">{globalComment}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // État par défaut si aucune correction
  return (
    <div className="text-center p-8">
      <p className="text-gray-600">Préparation de votre correction...</p>
    </div>
  )
}

// Composant pour afficher le texte annoté avec commentaires cliquables
function AnnotatedText({ text, comments }: { text: string; comments: InlineItem[] }) {
  const [selectedComment, setSelectedComment] = useState<InlineItem | null>(null)
  
  if (!comments?.length) {
    return <div className="whitespace-pre-wrap">{text}</div>
  }

  // Fonction pour trouver et remplacer les quotes par des spans colorés
  let annotatedText = text
  comments.forEach((comment, index) => {
    if (comment.quote) {
      const colorClass = {
        red: "bg-red-200 hover:bg-red-300 cursor-pointer border-b-2 border-red-400",
        orange: "bg-orange-200 hover:bg-orange-300 cursor-pointer border-b-2 border-orange-400",
        blue: "bg-blue-200 hover:bg-blue-300 cursor-pointer border-b-2 border-blue-400",
        green: "bg-green-200 hover:bg-green-300 cursor-pointer border-b-2 border-green-400",
      }[comment.tag || "blue"]

      const spanWithHandler = `<span class="${colorClass}" data-comment-index="${index}">${comment.quote}</span>`
      annotatedText = annotatedText.replace(comment.quote, spanWithHandler)
    }
  })

  return (
    <div>
      <div 
        className="whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: annotatedText }}
        onClick={(e) => {
          const target = e.target as HTMLElement
          const commentIndex = target.getAttribute('data-comment-index')
          if (commentIndex !== null) {
            setSelectedComment(comments[parseInt(commentIndex)])
          }
        }}
      />
      
      {/* Popup de commentaire */}
      {selectedComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h4 className="font-bold mb-2">Commentaire de Marie Terki</h4>
            <p className="text-gray-700 mb-4">{selectedComment.comment}</p>
            <button 
              onClick={() => setSelectedComment(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
