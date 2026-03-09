'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, RotateCcw, History, ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

const API_BASE = 'https://orquestrador-849629781489.southamerica-east1.run.app'
const USER_EMAIL = 'app@znit.com.br'
const HEADERS = { 'Authorization': `Bearer ${USER_EMAIL}`, 'Content-Type': 'application/json' }

const SUGGESTIONS = [
  'O que é Escopo 3?',
  'Como calcular emissões de transporte?',
  'Diferença entre Escopo 1, 2 e 3?',
]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  sources?: string[]
}

interface Conversation {
  conversation_id: number
  title: string
  message_count: number
  updated_at: string
}

function SimpleMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open && view === 'chat') setTimeout(() => inputRef.current?.focus(), 150)
  }, [open, view])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/conversations`, { headers: HEADERS })
      const data = await res.json()
      if (res.ok) {
        const list: Conversation[] = Array.isArray(data)
          ? data
          : Array.isArray(data.conversations)
          ? data.conversations
          : []
        setConversations(list.sort((a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        ))
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  async function openHistory() {
    setView('history')
    await loadHistory()
  }

  async function loadConversation(conv: Conversation) {
    setHistoryLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/conversations/${conv.conversation_id}/messages`, { headers: HEADERS })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar conversa')

      const msgs: ChatMessage[] = (data.messages ?? data ?? []).flatMap((m: {
        message_id: number
        question: string
        answer: string
        citations?: { document_name: string }[]
      }) => {
        const sources = [...new Set<string>((m.citations ?? []).map(c => c.document_name))]
        return [
          { id: `u-${m.message_id}`, role: 'user' as const, content: m.question },
          { id: `a-${m.message_id}`, role: 'assistant' as const, content: m.answer, sources },
        ]
      })

      setMessages(msgs)
      setConversationId(conv.conversation_id)
      setView('chat')
    } catch (err) {
      setMessages([{
        id: `e-${Date.now()}`,
        role: 'error',
        content: err instanceof Error ? err.message : 'Erro ao carregar conversa.',
      }])
      setView('chat')
    } finally {
      setHistoryLoading(false)
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }])
    setLoading(true)

    try {
      let answer: string
      let sources: string[] = []

      if (!conversationId) {
        const res = await fetch(`${API_BASE}/api/conversations`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ first_message: text }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao criar conversa')
        setConversationId(data.conversation.conversation_id)
        answer = data.first_message.answer
        sources = [...new Set<string>((data.first_message.citations ?? []).map((c: { document_name: string }) => c.document_name))]
      } else {
        const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({ question: text }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Erro ao enviar mensagem')
        answer = data.message.answer
        sources = [...new Set<string>((data.message.citations ?? []).map((c: { document_name: string }) => c.document_name))]
      }

      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: answer, sources }])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'error',
        content: err instanceof Error ? err.message : 'Falha na conexão com o agente.',
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function reset() {
    setMessages([])
    setConversationId(null)
    setInput('')
  }

  return (
    <>
      {/* FAB — only when panel is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full shadow-lg text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Abrir agente GHG"
        >
          <MessageCircle className="h-4 w-4" />
          <span>Agente GHG</span>
        </button>
      )}

      {/* Panel */}
      <div className={cn(
        'fixed right-0 top-14 bottom-0 z-40 flex flex-col border-l bg-background shadow-2xl transition-[width] duration-300 ease-in-out',
        open ? 'w-[380px]' : 'w-0 overflow-hidden pointer-events-none'
      )}>

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          {view === 'history' ? (
            <>
              <button
                onClick={() => setView('chat')}
                className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground mr-2">Conversas salvas</p>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)} title="Fechar">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <MessageCircle className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Agente GHG</p>
                  <p className="text-[11px] text-muted-foreground leading-tight">Vertex AI · RAG Protocol</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={openHistory} title="Histórico">
                  <History className="h-3.5 w-3.5" />
                </Button>
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={reset}>
                    <RotateCcw className="h-3 w-3" />
                    Nova
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setOpen(false)} title="Fechar">
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* ── HISTORY VIEW ── */}
        {view === 'history' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground gap-2">
                <History className="h-7 w-7 opacity-20" />
                <p className="text-xs">Nenhuma conversa salva ainda.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {conversations.map(conv => (
                  <li key={conv.conversation_id}>
                    <button
                      onClick={() => loadConversation(conv)}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                    >
                      <p className="text-xs font-medium truncate">{conv.title || 'Sem título'}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {conv.message_count} {conv.message_count === 1 ? 'mensagem' : 'mensagens'} · {formatDate(conv.updated_at)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── CHAT VIEW ── */}
        {view === 'chat' && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 select-none">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-primary/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Agente de Emissões GHG</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-56">
                      Tire dúvidas sobre metodologias GHG Protocol, escopos e cálculo de emissões.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-64 mt-1">
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); inputRef.current?.focus() }}
                        className="text-left text-xs px-3.5 py-2.5 rounded-xl border bg-background hover:bg-accent transition-colors leading-snug"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(msg => (
                    <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed',
                        msg.role === 'user' && 'bg-primary text-primary-foreground rounded-tr-sm',
                        msg.role === 'assistant' && 'bg-muted text-foreground rounded-tl-sm',
                        msg.role === 'error' && 'bg-destructive/10 text-destructive rounded-tl-sm border border-destructive/20',
                      )}>
                        <p className="whitespace-pre-wrap">
                          <SimpleMarkdown text={msg.content} />
                        </p>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30 space-y-0.5">
                            <p className="text-[10px] font-semibold opacity-50 uppercase tracking-wide mb-1">Fontes</p>
                            {msg.sources.map((src, i) => (
                              <a
                                key={i}
                                href={`https://www.google.com/search?q=${encodeURIComponent(src.replace(/\.pdf$/i, '') + ' GHG Protocol filetype:pdf')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] opacity-60 hover:opacity-100 flex items-center gap-1 hover:underline transition-opacity"
                                title={src}
                              >
                                📄 <span className="truncate">{src}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="shrink-0 px-4 py-3 border-t bg-background">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize(e.target) }}
                  onKeyDown={onKeyDown}
                  placeholder="Pergunte sobre GHG, Escopo 3..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed overflow-hidden"
                  style={{ minHeight: '38px', maxHeight: '120px' }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  className="h-[38px] w-[38px] shrink-0 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 ml-0.5">
                Enter para enviar · Shift+Enter nova linha
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
