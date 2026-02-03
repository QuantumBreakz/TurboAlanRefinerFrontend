"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { useAuth } from "./AuthContext"

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface DocumentContext {
  file_id: string
  job_id?: string
  filename: string
  file_type: string
  current_pass: number
  metadata?: Record<string, any>
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  participants: string[]
  message_count: number
  document_count: number
  active_document_id?: string
  created_at: number
  updated_at: number
}

export interface PresenceInfo {
  workspace_id: string
  online_count: number
  online_users: string[]
  typing_users: string[]
}

export interface WorkspaceState {
  // Current workspace
  currentWorkspace: Workspace | null
  workspaces: Workspace[]
  
  // Messages
  messages: ChatMessage[]
  isLoadingMessages: boolean
  
  // Documents
  documents: DocumentContext[]
  activeDocumentId: string | null
  
  // Real-time state
  isConnected: boolean
  onlineUsers: string[]
  typingUsers: string[]
  
  // Chat state
  isSending: boolean
  error: string | null
}

export interface WorkspaceActions {
  // Workspace management
  createWorkspace: (name?: string) => Promise<Workspace | null>
  selectWorkspace: (workspaceId: string) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<boolean>
  refreshWorkspaces: () => Promise<void>
  
  // Participant management
  addParticipant: (userId: string) => Promise<boolean>
  removeParticipant: (userId: string) => Promise<boolean>
  
  // Messages
  sendMessage: (content: string, schemaLevels?: Record<string, number>) => Promise<ChatMessage | null>
  clearMessages: () => Promise<void>
  
  // Documents
  addDocument: (fileId: string, filename: string, fileType: string, jobId?: string) => Promise<void>
  setActiveDocument: (fileId: string) => Promise<void>
  
  // Typing indicator
  setTyping: (isTyping: boolean) => void
  
  // Connection
  connect: () => void
  disconnect: () => void
}

type WorkspaceContextType = WorkspaceState & WorkspaceActions

// ============================================================================
// Context
// ============================================================================

const WorkspaceContext = createContext<WorkspaceContextType | null>(null)

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider")
  }
  return context
}

// ============================================================================
// Provider
// ============================================================================

interface WorkspaceProviderProps {
  children: ReactNode
  autoConnect?: boolean
}

export function WorkspaceProvider({ children, autoConnect = true }: WorkspaceProviderProps) {
  const { user } = useAuth()
  const userId = user?.id || "default"
  
  // State
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [documents, setDocuments] = useState<DocumentContext[]>([])
  const [activeDocumentId, setActiveDocumentIdState] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Backend URL from env with fallback
  const backendUrl = 
    process.env.NEXT_PUBLIC_REFINER_BACKEND_URL || 
    process.env.NEXT_PUBLIC_BACKEND_URL || 
    "/api"

  // WebSocket URL - FIXED: Don't use /api proxy for WebSocket, needs direct backend connection
  const wsUrl = process.env.NEXT_PUBLIC_REFINER_BACKEND_WS_URL || 
                (typeof window !== "undefined" 
                  ? (window.location.protocol === "https:" 
                    ? `wss://${window.location.hostname}:8000` 
                    : `ws://${window.location.hostname}:8000`)
                  : "ws://localhost:8000")

  // ============================================================================
  // WebSocket Handlers
  // ============================================================================

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case "message":
          // New message received
          const newMessage = data.data as ChatMessage
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
          break
          
        case "typing":
          // Typing indicator update
          const { user_id, is_typing } = data.data
          setTypingUsers(prev => {
            if (is_typing) {
              return prev.includes(user_id) ? prev : [...prev, user_id]
            } else {
              return prev.filter(id => id !== user_id)
            }
          })
          break
          
        case "presence":
          // Presence update (user joined/left)
          setOnlineUsers(data.data.online_users || [])
          break
          
        case "document_update":
          // Document context update
          const { document_id, update_type } = data.data
          if (update_type === "active_changed") {
            setActiveDocumentIdState(document_id)
          }
          // Refresh documents list
          if (currentWorkspace) {
            fetchDocuments(currentWorkspace.id)
          }
          break
          
        case "messages_cleared":
          // Messages were cleared
          setMessages([])
          break
          
        case "pong":
          // Ping response - connection is alive
          break
      }
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e)
    }
  }, [currentWorkspace])

  const connect = useCallback(() => {
    if (!currentWorkspace || !userId) {
      console.log("Cannot connect: missing workspace or userId")
      return
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log("Already connected to workspace:", currentWorkspace.name)
      return
    }
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    try {
      // Always use the WebSocket URL (not /api proxy) - WebSockets must go directly to backend
      const wsEndpoint = `${wsUrl}/workspaces/${currentWorkspace.id}/ws?user_id=${encodeURIComponent(userId)}`
      
      console.log("🔌 Connecting to WebSocket:", wsEndpoint)
      const ws = new WebSocket(wsEndpoint)
      
      ws.onopen = () => {
        setIsConnected(true)
        setError(null)
        console.log("✅ WebSocket connected to workspace:", currentWorkspace.name)
      }
      
      ws.onmessage = handleWebSocketMessage
      
      ws.onerror = (event) => {
        console.error("❌ WebSocket error:", event)
        setError("Connection error")
        setIsConnected(false)
      }
      
      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason)
        setIsConnected(false)
        wsRef.current = null
        
        // Auto-reconnect if not intentional close
        if (event.code !== 1000 && currentWorkspace) {
          console.log("🔄 Reconnecting in 3 seconds...")
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }
      
      wsRef.current = ws
    } catch (e) {
      console.error("Failed to create WebSocket:", e)
      setError("Failed to connect")
      setIsConnected(false)
    }
  }, [currentWorkspace, userId, wsUrl, handleWebSocketMessage])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected")
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  // ============================================================================
  // API Functions
  // ============================================================================

  const fetchWorkspaces = useCallback(async () => {
    if (!userId) return
    
    try {
      const res = await fetch(`/api/workspaces?user_id=${encodeURIComponent(userId)}`)
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data)
      }
    } catch (e) {
      console.error("Failed to fetch workspaces:", e)
    }
  }, [userId])

  const fetchMessages = useCallback(async (workspaceId: string) => {
    if (!userId) return
    
    setIsLoadingMessages(true)
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/messages?user_id=${encodeURIComponent(userId)}`
      )
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [userId])

  const fetchDocuments = useCallback(async (workspaceId: string) => {
    if (!userId) return
    
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/documents?user_id=${encodeURIComponent(userId)}`
      )
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
        setActiveDocumentIdState(data.active_document_id || null)
      }
    } catch (e) {
      console.error("Failed to fetch documents:", e)
    }
  }, [userId])

  // ============================================================================
  // Workspace Management
  // ============================================================================

  const createWorkspace = useCallback(async (name?: string): Promise<Workspace | null> => {
    if (!userId) return null
    
    try {
      const res = await fetch(`/api/workspaces?user_id=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
      
      if (res.ok) {
        const workspace = await res.json()
        setWorkspaces(prev => [workspace, ...prev])
        return workspace
      }
    } catch (e) {
      console.error("Failed to create workspace:", e)
      setError("Failed to create workspace")
    }
    return null
  }, [userId])

  const selectWorkspace = useCallback(async (workspaceId: string) => {
    // Disconnect from current workspace
    disconnect()
    
    // Find workspace in list or fetch it
    let workspace = workspaces.find(ws => ws.id === workspaceId)
    
    if (!workspace && userId) {
      try {
        const res = await fetch(
          `/api/workspaces/${workspaceId}?user_id=${encodeURIComponent(userId)}`
        )
        if (res.ok) {
          workspace = await res.json()
        }
      } catch (e) {
        console.error("Failed to fetch workspace:", e)
      }
    }
    
    if (workspace) {
      setCurrentWorkspace(workspace)
      setMessages([])
      setDocuments([])
      setActiveDocumentIdState(null)
      
      // Fetch workspace data
      await Promise.all([
        fetchMessages(workspaceId),
        fetchDocuments(workspaceId)
      ])
    }
  }, [workspaces, userId, disconnect, fetchMessages, fetchDocuments])

  const deleteWorkspace = useCallback(async (workspaceId: string): Promise<boolean> => {
    if (!userId) return false
    
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}?user_id=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      )
      
      if (res.ok) {
        setWorkspaces(prev => prev.filter(ws => ws.id !== workspaceId))
        if (currentWorkspace?.id === workspaceId) {
          setCurrentWorkspace(null)
          disconnect()
        }
        return true
      }
    } catch (e) {
      console.error("Failed to delete workspace:", e)
    }
    return false
  }, [userId, currentWorkspace, disconnect])

  const refreshWorkspaces = useCallback(async () => {
    await fetchWorkspaces()
  }, [fetchWorkspaces])

  // ============================================================================
  // Participant Management
  // ============================================================================

  const addParticipant = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentWorkspace || !userId) return false
    
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/participants?added_by=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: targetUserId })
        }
      )
      return res.ok
    } catch (e) {
      console.error("Failed to add participant:", e)
      return false
    }
  }, [currentWorkspace, userId])

  const removeParticipant = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!currentWorkspace || !userId) return false
    
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/participants/${targetUserId}?removed_by=${encodeURIComponent(userId)}`,
        { method: "DELETE" }
      )
      return res.ok
    } catch (e) {
      console.error("Failed to remove participant:", e)
      return false
    }
  }, [currentWorkspace, userId])

  // ============================================================================
  // Messages
  // ============================================================================

  const sendMessage = useCallback(async (
    content: string,
    schemaLevels?: Record<string, number>
  ): Promise<ChatMessage | null> => {
    if (!currentWorkspace || !userId || !content.trim()) return null
    
    setIsSending(true)
    setError(null)
    
    // Optimistically add user message
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: currentWorkspace.id,
      sender_id: userId,
      role: "user",
      content: content.trim(),
      timestamp: Date.now() / 1000
    }
    setMessages(prev => [...prev, tempMessage])
    
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/chat?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: content,
            schemaLevels 
          })
        }
      )
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        // Replace temp message with real one and add assistant response
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== tempMessage.id)
          const newMessages = [...filtered]
          
          if (data.user_message) {
            newMessages.push(data.user_message)
          }
          if (data.assistant_message) {
            newMessages.push(data.assistant_message)
          }
          
          return newMessages
        })
        
        return data.assistant_message
      } else {
        // Handle error
        setError(data.error || "Failed to send message")
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
        return null
      }
    } catch (e) {
      console.error("Failed to send message:", e)
      setError("Network error")
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
      return null
    } finally {
      setIsSending(false)
    }
  }, [currentWorkspace, userId])

  const clearMessages = useCallback(async () => {
    if (!currentWorkspace || !userId) return
    
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/clear?user_id=${encodeURIComponent(userId)}`,
        { method: "POST" }
      )
      
      if (res.ok) {
        setMessages([])
      }
    } catch (e) {
      console.error("Failed to clear messages:", e)
    }
  }, [currentWorkspace, userId])

  // ============================================================================
  // Documents
  // ============================================================================

  const addDocument = useCallback(async (
    fileId: string,
    filename: string,
    fileType: string,
    jobId?: string
  ) => {
    if (!currentWorkspace || !userId) return
    
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/documents?user_id=${encodeURIComponent(userId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_id: fileId, filename, file_type: fileType, job_id: jobId })
        }
      )
      
      if (res.ok) {
        await fetchDocuments(currentWorkspace.id)
      }
    } catch (e) {
      console.error("Failed to add document:", e)
    }
  }, [currentWorkspace, userId, fetchDocuments])

  const setActiveDocument = useCallback(async (fileId: string) => {
    if (!currentWorkspace || !userId) return
    
    try {
      const res = await fetch(
        `/api/workspaces/${currentWorkspace.id}/documents/${fileId}/active?user_id=${encodeURIComponent(userId)}`,
        { method: "PUT" }
      )
      
      if (res.ok) {
        setActiveDocumentIdState(fileId)
      }
    } catch (e) {
      console.error("Failed to set active document:", e)
    }
  }, [currentWorkspace, userId])

  // ============================================================================
  // Typing Indicator
  // ============================================================================

  const setTyping = useCallback((isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
    // Send typing indicator
    wsRef.current.send(JSON.stringify({
      type: "typing",
      data: { is_typing: isTyping }
    }))
    
    // Auto-clear typing after 5 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false)
      }, 5000)
    }
  }, [])

  // ============================================================================
  // Effects
  // ============================================================================

  // Load workspaces on mount
  useEffect(() => {
    if (userId) {
      fetchWorkspaces()
    }
  }, [userId, fetchWorkspaces])

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (workspaces.length > 0 && !currentWorkspace) {
      console.log("Auto-selecting first workspace:", workspaces[0].name)
      selectWorkspace(workspaces[0].id)
    }
  }, [workspaces, currentWorkspace, selectWorkspace])

  // Auto-connect when workspace changes
  useEffect(() => {
    if (autoConnect && currentWorkspace) {
      connect()
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [autoConnect, currentWorkspace, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [disconnect])

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: WorkspaceContextType = {
    // State
    currentWorkspace,
    workspaces,
    messages,
    isLoadingMessages,
    documents,
    activeDocumentId,
    isConnected,
    onlineUsers,
    typingUsers,
    isSending,
    error,
    
    // Actions
    createWorkspace,
    selectWorkspace,
    deleteWorkspace,
    refreshWorkspaces,
    addParticipant,
    removeParticipant,
    sendMessage,
    clearMessages,
    addDocument,
    setActiveDocument,
    setTyping,
    connect,
    disconnect
  }

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  )
}
