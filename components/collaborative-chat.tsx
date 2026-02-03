"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWorkspace, ChatMessage, Workspace } from "@/contexts/WorkspaceContext"
import { useAuth } from "@/contexts/AuthContext"
import { ChevronDown, Plus, MessageSquare, Trash2, History } from "lucide-react"

// ============================================================================
// Types
// ============================================================================

interface CollaborativeChatProps {
  onSchemaUpdate?: (schemaLevels: Record<string, number>) => void
  currentSchemaLevels?: Record<string, number>
  className?: string
}

// Quick action suggestions
const QUICK_ACTIONS = [
  { label: "Summarize", prompt: "Please summarize the key points of this document" },
  { label: "Improve tone", prompt: "Can you suggest how to improve the tone of this text?" },
  { label: "Fix grammar", prompt: "Please check for grammar issues and suggest corrections" },
  { label: "Simplify", prompt: "Help me simplify this text for better readability" },
  { label: "Make formal", prompt: "Can you help make this text more formal and professional?" },
]

// ============================================================================
// Component
// ============================================================================

export default function CollaborativeChat({ 
  onSchemaUpdate, 
  currentSchemaLevels = {},
  className = ""
}: CollaborativeChatProps) {
  const { user } = useAuth()
  const {
    currentWorkspace,
    messages,
    isLoadingMessages,
    isConnected,
    onlineUsers,
    typingUsers,
    isSending,
    error,
    sendMessage,
    setTyping,
    clearMessages,
    createWorkspace,
    selectWorkspace,
    workspaces,
  } = useWorkspace()

  const [inputValue, setInputValue] = useState("")
  const [showQuickActions, setShowQuickActions] = useState(true)
  const [showWorkspaceSelector, setShowWorkspaceSelector] = useState(false)
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Initialize workspace if none exists
  useEffect(() => {
    if (!currentWorkspace && workspaces.length === 0) {
      createWorkspace("My Workspace")
    } else if (!currentWorkspace && workspaces.length > 0) {
      selectWorkspace(workspaces[0].id)
    }
  }, [currentWorkspace, workspaces, createWorkspace, selectWorkspace])

  // Handle typing indicator with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    
    // Debounce typing indicator
    if (typingDebounceRef.current) {
      clearTimeout(typingDebounceRef.current)
    }
    
    if (e.target.value.trim()) {
      setTyping(true)
      typingDebounceRef.current = setTimeout(() => {
        setTyping(false)
      }, 2000)
    } else {
      setTyping(false)
    }
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return
    
    const messageToSend = inputValue.trim()
    setInputValue("")
    setTyping(false)
    setShowQuickActions(false)
    
    // Handle special commands (only /clear and /schema)
    if (messageToSend === "/clear") {
      clearMessages()
      return
    }
    
    // Send everything else to AI - let it handle context and collaboration
    await sendMessage(messageToSend, currentSchemaLevels)
  }

  // Note: handleLocalCommand removed - AI now handles everything contextually

  // Handle quick action click
  const handleQuickAction = (prompt: string) => {
    setInputValue(prompt)
    inputRef.current?.focus()
  }

  // Get message styling based on role
  const getMessageStyles = (message: ChatMessage) => {
    const isOwnMessage = message.sender_id === user?.id
    
    switch (message.role) {
      case "user":
        return isOwnMessage
          ? "bg-primary/10 text-primary-foreground ml-12 border-l-4 border-primary"
          : "bg-blue-50 dark:bg-blue-950 text-foreground ml-8 border-l-4 border-blue-400"
      case "assistant":
        return "bg-muted text-foreground mr-8 border-l-4 border-emerald-500"
      case "system":
        return "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 mx-4 border-l-4 border-amber-400 text-sm"
      default:
        return "bg-muted text-foreground"
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Get sender display name
  const getSenderName = (message: ChatMessage) => {
    if (message.role === "assistant") return "AI Assistant"
    if (message.role === "system") return "System"
    if (message.sender_id === user?.id) return "You"
    return message.sender_id.slice(0, 8) // Show truncated user ID
  }

  // Handle workspace switching
  const handleSwitchWorkspace = async (workspaceId: string) => {
    await selectWorkspace(workspaceId)
    setShowWorkspaceSelector(false)
  }

  // Handle creating new workspace
  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return
    
    setIsCreatingWorkspace(true)
    try {
      await createWorkspace(newWorkspaceName.trim())
      setNewWorkspaceName("")
    } catch (error) {
      console.error("Failed to create workspace:", error)
    } finally {
      setIsCreatingWorkspace(false)
    }
  }

  // Format relative time for workspace list
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - (timestamp * 1000)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  return (
    <Card className={`bg-card border-border h-[40rem] md:h-[44rem] flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-card-foreground text-lg">Collaborative Chat</CardTitle>
              
              {/* Workspace Selector */}
              <DropdownMenu 
                open={showWorkspaceSelector} 
                onOpenChange={(open) => {
                  console.log("Dropdown state:", open)
                  setShowWorkspaceSelector(open)
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 gap-1 px-2 text-xs border-dashed hover:border-solid"
                  >
                    <MessageSquare className="h-3 w-3" />
                    <span className="max-w-[120px] truncate">
                      {currentWorkspace?.name || "Select Workspace"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[280px]">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Workspaces</span>
                    <Badge variant="secondary" className="text-xs">
                      {workspaces.length}
                    </Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* Workspace List */}
                  <ScrollArea className="max-h-[300px]">
                    {workspaces.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No workspaces yet
                      </div>
                    ) : (
                      workspaces.map((workspace) => (
                        <DropdownMenuItem
                          key={workspace.id}
                          onClick={() => handleSwitchWorkspace(workspace.id)}
                          className={`flex flex-col items-start gap-1 px-3 py-2 ${
                            currentWorkspace?.id === workspace.id ? "bg-accent" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-medium text-sm truncate flex-1">
                              {workspace.name}
                            </span>
                            {currentWorkspace?.id === workspace.id && (
                              <Badge variant="secondary" className="text-xs ml-2">
                                Active
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {workspace.message_count || 0}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <History className="h-3 w-3" />
                              {formatRelativeTime(workspace.updated_at)}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </ScrollArea>
                  
                  <DropdownMenuSeparator />
                  
                  {/* New Workspace Form */}
                  <div className="px-2 py-2">
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="New workspace name..."
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateWorkspace()}
                        className="h-8 text-xs"
                        disabled={isCreatingWorkspace}
                      />
                      <Button
                        size="sm"
                        onClick={handleCreateWorkspace}
                        disabled={!newWorkspaceName.trim() || isCreatingWorkspace}
                        className="h-8 w-8 p-0"
                      >
                        {isCreatingWorkspace ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardDescription className="text-muted-foreground text-xs">
              AI-powered document collaboration
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Connection status */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${isConnected 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300" 
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    {isConnected ? "Live" : "Offline"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {isConnected 
                    ? `Connected to workspace • ${onlineUsers.length} online`
                    : "Reconnecting..."
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Online users count */}
            {onlineUsers.length > 1 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      {onlineUsers.length}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium mb-1">Online now:</div>
                      {onlineUsers.map(uid => (
                        <div key={uid} className="text-muted-foreground">
                          {uid === user?.id ? "You" : uid.slice(0, 12)}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-3 min-h-0">
          <div className="space-y-3">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-3">💬</div>
                <div className="font-medium">Start a collaborative conversation</div>
                <div className="text-sm">I can help you analyze documents, improve content, collaborate with your team, and much more!</div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg transition-all ${getMessageStyles(message)}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium opacity-70">
                        {getSenderName(message)}
                      </span>
                      {message.role === "user" && message.sender_id !== user?.id && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          Collaborator
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ))
            )}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm px-3 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>
                  {typingUsers.length === 1 
                    ? `${typingUsers[0] === user?.id ? "You are" : "Someone is"} typing...`
                    : `${typingUsers.length} people typing...`
                  }
                </span>
              </div>
            )}
            
            {/* AI thinking indicator */}
            {isSending && (
              <div className="bg-muted p-3 rounded-lg mr-8 border-l-4 border-emerald-500">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500" />
                  <span className="text-muted-foreground text-sm">AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {showQuickActions && messages.length === 0 && (
          <div className="px-4 py-2 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Quick actions:</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => handleQuickAction(action.prompt)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-950/30 border-t border-red-200 dark:border-red-800">
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background/50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              placeholder={
                currentWorkspace 
                  ? "Ask me anything about your documents, collaborate with your team, or get AI assistance..."
                  : "Creating workspace..."
              }
              className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              disabled={isSending || !currentWorkspace}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending || !currentWorkspace}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-4"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </Button>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              💡 I understand your documents and can help with analysis, editing, and collaboration • /clear to reset
            </div>
            {currentWorkspace && (
              <div className="text-xs text-muted-foreground">
                {messages.length} messages
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
