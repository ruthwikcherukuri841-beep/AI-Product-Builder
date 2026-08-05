import { useState, useEffect, useRef } from "react";
import { 
  useGetChatSession, 
  useSendChatMessage, 
  getGetChatSessionQueryKey,
  getListChatSessionsQueryKey,
  useGetChatStats
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, Loader2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useAuth } from "@workspace/replit-auth-web";
import { format } from "date-fns";

export function ChatInterface({ sessionId }: { sessionId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: sessionData, isLoading } = useGetChatSession(sessionId, {
    query: {
      enabled: !!sessionId,
      queryKey: getGetChatSessionQueryKey(sessionId),
    }
  });

  const sendMessage = useSendChatMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatSessionQueryKey(sessionId) });
        queryClient.invalidateQueries({ queryKey: getListChatSessionsQueryKey() });
        // The stats endpoint key isn't exported from api schema, but we can invalidate all or stats
        queryClient.invalidateQueries({ queryKey: ["/api/chat/stats"] });
      }
    }
  });

  useEffect(() => {
    // Check if there's an initial prompt for this session
    const initialPrompt = sessionStorage.getItem(`initial_prompt_${sessionId}`);
    if (initialPrompt && !sessionData?.messages?.length && !sendMessage.isPending) {
      sessionStorage.removeItem(`initial_prompt_${sessionId}`);
      sendMessage.mutate({ sessionId, data: { content: initialPrompt } });
    }
  }, [sessionId, sessionData?.messages?.length, sendMessage.isPending]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [sessionData?.messages, sendMessage.isPending]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;
    
    sendMessage.mutate({ sessionId, data: { content: input.trim() } });
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  const messages = sessionData?.messages || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background relative">
      <ScrollArea className="flex-1 px-4 py-6" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
          {messages.length === 0 && !sendMessage.isPending && (
            <div className="text-center text-muted-foreground py-20 animate-in fade-in">
              <p>This is the start of your conversation.</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className={`h-8 w-8 mt-1 border shadow-sm ${message.role === 'user' ? 'border-primary/20' : 'border-border'}`}>
                {message.role === 'user' ? (
                  <>
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary"><User className="h-4 w-4" /></AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-card text-foreground">
                    <span className="font-display font-bold">L</span>
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className={`flex flex-col gap-1 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-muted-foreground ml-1">
                  {message.role === 'user' ? 'You' : 'Lumina'} • {format(new Date(message.createdAt), 'h:mm a')}
                </span>
                <div 
                  className={`
                    px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/20' 
                      : 'bg-card border border-border/50 text-foreground rounded-tl-sm shadow-sm prose prose-sm dark:prose-invert max-w-none'}
                  `}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                </div>
              </div>
            </div>
          ))}

          {sendMessage.isPending && (
            <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
              <Avatar className="h-8 w-8 mt-1 border border-border shadow-sm">
                <AvatarFallback className="bg-card text-foreground">
                  <span className="font-display font-bold">L</span>
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground ml-1">Lumina is thinking...</span>
                <div className="px-4 py-3 rounded-2xl bg-card border border-border/50 rounded-tl-sm shadow-sm flex items-center gap-1.5 h-11">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/40">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="min-h-[56px] max-h-72 resize-none rounded-2xl bg-card border-border/50 focus-visible:ring-primary/30 pr-12 shadow-sm py-4"
            disabled={sendMessage.isPending}
            rows={1}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!input.trim() || sendMessage.isPending}
            className="absolute right-2 bottom-2 h-10 w-10 rounded-xl rounded-br-lg"
          >
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
        <div className="text-center mt-2">
          <p className="text-[10px] text-muted-foreground">Lumina may produce inaccurate information about people, places, or facts.</p>
        </div>
      </div>
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || "");
          const language = match ? match[1] : "";
          const codeString = String(children).replace(/\n$/, "");

          if (!inline && language) {
            return (
              <div className="relative group my-4 rounded-md overflow-hidden bg-[#1e1e1e] border border-border">
                <div className="flex items-center justify-between px-4 py-1.5 bg-[#2d2d2d] border-b border-white/10">
                  <span className="text-xs font-mono text-gray-400">{language}</span>
                  <CopyButton text={codeString} />
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus as any}
                  language={language}
                  PreTag="div"
                  customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[0.85em] text-primary" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-white transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}