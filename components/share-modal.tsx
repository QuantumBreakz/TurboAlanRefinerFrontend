"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { X, UserPlus, Users, Loader2, Share2 } from "lucide-react"
import { ChatSession } from "@/contexts/ChatContext"
import { useAuth } from "@/contexts/AuthContext"

interface ShareModalProps {
  session: ChatSession
  onClose: () => void
  onUpdate?: () => void
}

interface Participant {
  user_id: string
  email: string
  name: string
  is_owner?: boolean
  joined_at?: string
}

export function ShareModal({ session, onClose, onUpdate }: ShareModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingParticipants, setLoadingParticipants] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isShared, setIsShared] = useState(session.is_shared || false)

  // Sync local state with session prop
  useEffect(() => {
    setIsShared(session.is_shared || false)
  }, [session.is_shared])

  // Load participants
  useEffect(() => {
    if (isShared) {
      loadParticipants()
    } else {
      setLoadingParticipants(false)
    }
  }, [session.id, isShared])

  const loadParticipants = async () => {
    try {
      setLoadingParticipants(true)
      const response = await fetch(
        `/api/chat/sessions/${session.id}/participants?user_id=${user?.id}`
      )
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      }
    } catch (err) {
      console.error("Failed to load participants:", err)
    } finally {
      setLoadingParticipants(false)
    }
  }

  const handleEnableSharing = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/chat/sessions/${session.id}/share?user_id=${user?.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participant_emails: [] })
        }
      )

      if (!response.ok) {
        throw new Error("Failed to enable sharing")
      }

      // Update local state to trigger UI change
      setIsShared(true)

      // Reload participants
      await loadParticipants()
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable sharing")
    } finally {
      setLoading(false)
    }
  }

  const handleAddParticipant = async () => {
    if (!email.trim() || !validateEmail(email)) {
      setError("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Enable sharing first if not already shared
      if (!isShared) {
        await handleEnableSharing()
      }

      const response = await fetch(
        `/api/chat/sessions/${session.id}/participants?user_id=${user?.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        }
      )

      if (!response.ok) {
        throw new Error("Failed to add participant")
      }

      setEmail("")
      await loadParticipants()
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add participant")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/chat/sessions/${session.id}/participants/${participantId}?user_id=${user?.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Failed to remove participant")
      }

      await loadParticipants()
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove participant")
    } finally {
      setLoading(false)
    }
  }

  const handleMakePrivate = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/chat/sessions/${session.id}/share?user_id=${user?.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Failed to make session private")
      }

      // Update local state
      setIsShared(false)
      onUpdate?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to make session private")
    } finally {
      setLoading(false)
    }
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isOwner = session.user_id === user?.id

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share "{session.title}"
          </DialogTitle>
          <DialogDescription>
            {isShared
              ? "Manage who can access this chat session"
              : "Share this session with your team"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {!isShared ? (
            <div className="text-center py-6">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                This session is currently private. Enable sharing to collaborate with others.
              </p>
              <Button onClick={handleEnableSharing} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Share2 className="w-4 h-4 mr-2" />
                Enable Sharing
              </Button>
            </div>
          ) : (
            <>
              {/* Add participant */}
              {isOwner && (
                <div className="space-y-2">
                  <Label htmlFor="email">Invite by email</Label>
                  <div className="flex gap-2">
                    <Input
                      id="email"
                      type="email"
                      placeholder="colleague@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddParticipant()
                        }
                      }}
                      disabled={loading}
                    />
                    <Button
                      onClick={handleAddParticipant}
                      disabled={loading || !email.trim()}
                      size="icon"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Participants list */}
              <div className="space-y-2">
                <Label>Participants ({participants.length})</Label>
                {loadingParticipants ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {participants.map((participant) => (
                      <div
                        key={participant.user_id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {participant.name[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium flex items-center gap-2">
                              {participant.name}
                              {participant.is_owner && (
                                <span className="text-xs text-muted-foreground">(Owner)</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {participant.email}
                            </div>
                          </div>
                        </div>
                        {isOwner && !participant.is_owner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveParticipant(participant.user_id)}
                            disabled={loading}
                            className="h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Make private option */}
              {isOwner && (
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleMakePrivate}
                    disabled={loading}
                    className="w-full"
                  >
                    Make Private
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    This will remove all participants and disable sharing
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
