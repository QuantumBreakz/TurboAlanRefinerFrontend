"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { useAuth } from "./AuthContext"

// --- Types ---

export interface ChatSession {
  id: string
  user_id: string
  title: string
  workspace_id?: string
  created_at: string
  updated_at: string
  message_count: number
  metadata?: {
    first_message_preview?: string
    last_message_preview?: string
  }
}

export interface ChatMessage {
  id: string
  session_id: string
  user_id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
  metadata?: {
    file_id?: string
    job_id?: string
  }
}

interface ChatContextType {
  // State
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  
  // Actions
  createSession: (title?: string, workspaceId?: string) => Promise<string | null>
  switchSession: (sessionId: string) => Promise<void>
  deleteSession: (sessionId: string) => Promise<void>
  renameSession: (sessionId: string, title: string) => Promise<void>
  clearMessages: (sessionId: string) => Promise<void>
  sendMessage: (content: string, role?: string, metadata?: any) => Promise<void>
  refreshSessions: () => Promise<void>
  refreshMessages: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// --- Provider ---

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- API Methods ---

  const refreshSessions = useCallback(async () => {
    if (!user?.id) {
      console.warn("[ChatContext] No user ID found, cannot load sessions")
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log("[ChatContext] Loading sessions for user:", user.id)
      const response = await fetch(`/api/chat/sessions?user_id=${user.id}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[ChatContext] Loaded sessions:", data.sessions?.length || 0, "sessions")
      
      // SECURITY: Verify all sessions belong to current user
      const userSessions = (data.sessions || []).filter((s: ChatSession) => s.user_id === user.id)
      if (userSessions.length !== (data.sessions || []).length) {
        console.error("[ChatContext] Security Warning: Filtered out sessions from other users!")
      }
      
      setSessions(userSessions)
    } catch (err) {
      console.error("Failed to refresh sessions:", err)
      setError(err instanceof Error ? err.message : "Failed to load sessions")
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const refreshMessages = useCallback(async () => {
    if (!currentSession || !user?.id) return

    try {
      const response = await fetch(
        `/api/chat/sessions/${currentSession.id}/messages?user_id=${user.id}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`)
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error("Failed to refresh messages:", err)
      setError(err instanceof Error ? err.message : "Failed to load messages")
    }
  }, [currentSession, user])

  const createSession = useCallback(async (title?: string, workspaceId?: string): Promise<string | null> => {
    if (!user?.id) {
      console.warn("[ChatContext] No user ID, cannot create session")
      return null
    }

    try {
      setLoading(true)
      setError(null)

      console.log("[ChatContext] Creating session for user:", user.id)
      const response = await fetch(`/api/chat/sessions?user_id=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          workspace_id: workspaceId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`)
      }

      const session = await response.json()
      
      // Add to sessions list at the top
      setSessions(prev => [session, ...prev])
      setCurrentSession(session)
      setMessages([])

      return session.id
    } catch (err) {
      console.error("Failed to create session:", err)
      setError(err instanceof Error ? err.message : "Failed to create session")
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  const switchSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session || !user?.id) return

    try {
      setLoading(true)
      setError(null)
      setCurrentSession(session)

      // Load messages for this session
      const response = await fetch(
        `/api/chat/sessions/${sessionId}/messages?user_id=${user.id}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`)
      }

      const data = await response.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error("Failed to switch session:", err)
      setError(err instanceof Error ? err.message : "Failed to switch session")
    } finally {
      setLoading(false)
    }
  }, [sessions, user])

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(
        `/api/chat/sessions/${sessionId}?user_id=${user.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error(`Failed to delete session: ${response.statusText}`)
      }

      // Remove from sessions list
      setSessions(prev => prev.filter(s => s.id !== sessionId))

      // If deleted session was current, switch to first available or create new
      if (currentSession?.id === sessionId) {
        const remaining = sessions.filter(s => s.id !== sessionId)
        if (remaining.length > 0) {
          await switchSession(remaining[0].id)
        } else {
          setCurrentSession(null)
          setMessages([])
          // Auto-create a new session
          await createSession()
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err)
      setError(err instanceof Error ? err.message : "Failed to delete session")
    }
  }, [user, sessions, currentSession, switchSession, createSession])

  const renameSession = useCallback(async (sessionId: string, title: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(
        `/api/chat/sessions/${sessionId}?user_id=${user.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to rename session: ${response.statusText}`)
      }

      // Update in sessions list
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title, updated_at: new Date().toISOString() } : s
      ))

      // Update current session if it's the one being renamed
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title } : null)
      }
    } catch (err) {
      console.error("Failed to rename session:", err)
      setError(err instanceof Error ? err.message : "Failed to rename session")
    }
  }, [user, currentSession])

  const clearMessages = useCallback(async (sessionId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch(
        `/api/chat/sessions/${sessionId}/messages?user_id=${user.id}`,
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error(`Failed to clear messages: ${response.statusText}`)
      }

      // If this is the current session, clear messages
      if (currentSession?.id === sessionId) {
        setMessages([])
      }

      // Update session message count
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, message_count: 0 } : s
      ))
    } catch (err) {
      console.error("Failed to clear messages:", err)
      setError(err instanceof Error ? err.message : "Failed to clear messages")
    }
  }, [user, currentSession])

  const sendMessage = useCallback(async (content: string, role = "user", metadata?: any) => {
    if (!currentSession || !user?.id) return

    try {
      // Optimistic update - add message to UI immediately
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        session_id: currentSession.id,
        user_id: user.id,
        role: role as "user" | "assistant" | "system",
        content,
        timestamp: new Date().toISOString(),
        metadata
      }
      setMessages(prev => [...prev, tempMessage])

      // Send to backend
      const response = await fetch(
        `/api/chat/sessions/${currentSession.id}/messages?user_id=${user.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, content, metadata })
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`)
      }

      const data = await response.json()

      // Replace temp message with real one
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...tempMessage, id: data.message_id }
          : msg
      ))

      // Add assistant response if provided
      if (data.assistant_message_id && data.assistant_content) {
        const assistantMessage: ChatMessage = {
          id: data.assistant_message_id,
          session_id: currentSession.id,
          user_id: user.id,
          role: "assistant",
          content: data.assistant_content,
          timestamp: new Date().toISOString(),
          metadata: data.assistant_metadata || {}
        }
        setMessages(prev => [...prev, assistantMessage])
        
        // Update session list (increment count by 2: user + assistant)
        setSessions(prev => {
          const updated = prev.map(s => 
            s.id === currentSession.id 
              ? { ...s, message_count: s.message_count + 2, updated_at: new Date().toISOString() }
              : s
          )
          // Sort by updated_at desc
          return updated.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        })
      } else {
        // No assistant response, just increment by 1
        setSessions(prev => {
          const updated = prev.map(s => 
            s.id === currentSession.id 
              ? { ...s, message_count: s.message_count + 1, updated_at: new Date().toISOString() }
              : s
          )
          // Sort by updated_at desc
          return updated.sort((a, b) => 
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        })
      }

    } catch (err) {
      console.error("Failed to send message:", err)
      setError(err instanceof Error ? err.message : "Failed to send message")
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith("temp-")))
    }
  }, [currentSession, user])

  // --- Effects ---

  // Load sessions on mount and when user changes
  useEffect(() => {
    if (user?.id) {
      refreshSessions()
      hasAutoCreatedRef.current = false // Reset auto-create flag for new user
    } else {
      setSessions([])
      setCurrentSession(null)
      setMessages([])
      hasAutoCreatedRef.current = false // Reset flag when user logs out
    }
  }, [user?.id]) // Only depend on user ID, not the entire refreshSessions function

  // Auto-select first session or create new one if none exist
  // Use a ref to track if we've already auto-created to prevent loops
  const hasAutoCreatedRef = useRef(false)
  
  useEffect(() => {
    if (!user?.id || loading) return

    if (sessions.length > 0 && !currentSession) {
      // Select the most recent session (first in list)
      const firstSession = sessions[0]
      setCurrentSession(firstSession)
      // Load messages for this session
      fetch(`/api/chat/sessions/${firstSession.id}/messages?user_id=${user.id}`)
        .then(res => res.json())
        .then(data => setMessages(data.messages || []))
        .catch(err => console.error("Failed to load messages:", err))
    } else if (sessions.length === 0 && !loading && user.id && !hasAutoCreatedRef.current) {
      // No sessions exist - create the first one (only once)
      hasAutoCreatedRef.current = true
      createSession("Chat 1")
    }
  }, [sessions.length, currentSession?.id, user?.id, loading]) // Only depend on primitive values, not functions

  // --- Context Value ---

  const value: ChatContextType = {
    sessions,
    currentSession,
    messages,
    loading,
    error,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    clearMessages,
    sendMessage,
    refreshSessions,
    refreshMessages
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

// --- Hook ---

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}
