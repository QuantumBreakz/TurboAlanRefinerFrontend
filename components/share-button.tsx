"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { ShareModal } from "./share-modal"
import { ChatSession } from "@/contexts/ChatContext"

interface ShareButtonProps {
  session: ChatSession
  onUpdate?: () => void
}

export function ShareButton({ session, onUpdate }: ShareButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <Button
        variant={session.is_shared ? "default" : "outline"}
        size="sm"
        onClick={() => setShowModal(true)}
        className="gap-2"
      >
        <Share2 className="w-4 h-4" />
        {session.is_shared ? "Shared" : "Share"}
      </Button>

      {showModal && (
        <ShareModal
          session={session}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  )
}
