"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChat } from "@/contexts/ChatContext"
import { formatDistanceToNow } from "date-fns"
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Loader2,
  Users
} from "lucide-react"
import { ShareButton } from "./share-button"

export default function ChatSessions() {
  const {
    sessions,
    currentSession,
    messages,
    loading,
    error,
    createSession,
    switchSession,
    deleteSession,
    renameSession,
    sendMessage
  } = useChat()

  const [messageInput, setMessageInput] = useState("")
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)

  const handleCreateSession = async () => {
    await createSession()
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return

    setSendingMessage(true)
    try {
      await sendMessage(messageInput.trim())
      setMessageInput("")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleRename = async (sessionId: string) => {
    if (!editTitle.trim()) return
    
    await renameSession(sessionId, editTitle)
    setEditingSessionId(null)
    setEditTitle("")
  }

  const handleDelete = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (!confirm("Delete this chat session? This cannot be undone.")) return
    
    await deleteSession(sessionId)
  }

  const startEditing = (sessionId: string, currentTitle: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setEditingSessionId(sessionId)
    setEditTitle(currentTitle)
  }

  const cancelEditing = () => {
    setEditingSessionId(null)
    setEditTitle("")
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      {/* Session Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={handleCreateSession}
            className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold shadow-md"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* Session List */}
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1 min-h-0">
            {sessions.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No chat sessions yet</p>
                <p className="text-xs">Click "New Chat" to start</p>
              </div>
            )}

            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => switchSession(session.id)}
                className={`
                  group relative p-3 rounded-lg cursor-pointer transition-all
                  ${currentSession?.id === session.id
                    ? "bg-yellow-50 border-2 border-yellow-400 shadow-sm"
                    : "hover:bg-gray-50 border-2 border-transparent"
                  }
                `}
              >
                {/* Edit Mode */}
                {editingSessionId === session.id ? (
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") handleRename(session.id)
                        if (e.key === "Escape") cancelEditing()
                      }}
                      className="flex-1 h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleRename(session.id)}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Session Title */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {session.title}
                        </h3>
                        {session.metadata?.last_message_preview && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {session.metadata.last_message_preview}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                          </span>
                          {session.message_count > 0 && (
                            <span className="text-xs text-gray-400">
                              • {session.message_count} {session.message_count === 1 ? "message" : "messages"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions (show on hover) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={(e) => startEditing(session.id, session.title, e)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:text-red-600"
                          onClick={(e) => handleDelete(session.id, e)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-gray-900">{currentSession.title}</h2>
                    {currentSession.is_shared && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                        <Users className="w-3 h-3" />
                        Shared
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {messages.length} {messages.length === 1 ? "message" : "messages"}
                    {currentSession.is_shared && currentSession.participants && (
                      <> • {currentSession.participants.length} participant{currentSession.participants.length !== 1 ? "s" : ""}</>
                    )}
                  </p>
                </div>
                <ShareButton 
                  session={currentSession} 
                  onUpdate={async () => {
                    // Refresh sessions to get updated sharing status
                    await switchSession(currentSession.id)
                  }}
                />
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4 max-w-4xl mx-auto min-h-0">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation below</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-lg px-4 py-3 shadow-sm
                          ${message.role === "user"
                            ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-black"
                            : message.role === "assistant"
                            ? "bg-gray-100 text-gray-900"
                            : "bg-blue-50 text-blue-900 text-sm"
                          }
                        `}
                      >
                        {message.role === "system" && (
                          <div className="text-xs font-semibold mb-1 opacity-70">SYSTEM</div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{message.content}</div>
                        <div className={`text-xs mt-2 ${message.role === "user" ? "text-black/70" : "text-gray-500"}`}>
                          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1"
                  disabled={sendingMessage}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendingMessage}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold"
                >
                  {sendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-24 w-24 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No session selected</p>
              <p className="text-sm">Create a new chat or select an existing one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
