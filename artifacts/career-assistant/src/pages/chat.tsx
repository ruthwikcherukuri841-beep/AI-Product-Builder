import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { 
  useListChatSessions, 
  useCreateChatSession, 
  useDeleteChatSession,
  getListChatSessionsQueryKey,
  useGetChatStats,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Settings, 
  LogOut, 
  PanelLeftClose, 
  PanelLeftOpen,
  Briefcase,
  Target,
  FileText,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ThemeToggle } from "@/lib/theme-toggle";
import { Link } from "wouter";

export default function ChatPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: sessions, isLoading: sessionsLoading } = useListChatSessions();
  const { data: stats } = useGetChatStats();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();

  const handleNewChat = () => {
    createSession.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (newSession) => {
          queryClient.invalidateQueries({ queryKey: getListChatSessionsQueryKey() });
          setLocation(`/chat/${newSession.id}`);
        }
      }
    );
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    deleteSession.mutate(
      { sessionId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListChatSessionsQueryKey() });
          if (sessionId === id) {
            setLocation("/chat");
          }
        }
      }
    );
  };

  const isNew = !sessionId;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`
          flex-shrink-0 flex flex-col border-r border-border/40 bg-sidebar/50 backdrop-blur-xl transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-72" : "w-0 opacity-0 border-none"}
        `}
      >
        <div className="p-4 flex items-center justify-between border-b border-border/40">
          <Link href="/chat" className="flex items-center gap-2 text-sidebar-foreground hover:text-primary transition-colors">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold tracking-tight">Lumina</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden">
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Button 
            onClick={handleNewChat} 
            className="w-full justify-start gap-2 h-10 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/30 shadow-none transition-all"
          >
            {createSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="font-medium">New Session</span>
          </Button>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1 pb-4">
            <div className="px-2 py-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
              Conversations
            </div>
            
            {sessionsLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : sessions?.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No sessions yet.
              </div>
            ) : (
              sessions?.map((session) => (
                <Link
                  key={session.id}
                  href={`/chat/${session.id}`}
                  className={`
                    group flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all
                    ${session.id === sessionId 
                      ? "bg-secondary text-secondary-foreground font-medium shadow-sm border border-border/50" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}
                  `}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${session.id === sessionId ? 'text-primary' : 'opacity-70'}`} />
                    <span className="truncate">{session.title || "Untitled Chat"}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive text-muted-foreground transition-all"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    disabled={deleteSession.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/40 space-y-2 bg-sidebar/80">
          <div className="flex items-center justify-between px-2 py-2 mb-2 bg-background/50 rounded-lg border border-border/40 shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Sessions</span>
              <span className="text-sm font-semibold">{stats?.totalSessions || 0}</span>
            </div>
            <div className="w-px h-6 bg-border"></div>
            <div className="flex flex-col text-right">
              <span className="text-xs text-muted-foreground">Messages</span>
              <span className="text-sm font-semibold">{stats?.totalMessages || 0}</span>
            </div>
          </div>
          
          <Link href="/profile" className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-all">
            <Settings className="h-4 w-4" />
            <span>Profile & Context</span>
          </Link>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-0 min-w-0">
        <header className="h-14 flex items-center gap-2 px-4 border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          )}
          <span className="font-display font-medium text-sm text-muted-foreground">
            {sessionId && sessions?.find(s => s.id === sessionId)?.title}
          </span>
        </header>

        {isNew ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mb-6 shadow-lg shadow-primary/5">
              <Briefcase className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mb-8">
              I'm ready to review your resume, help you prepare for interviews, or discuss your next career move.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
              <QuickStartCard 
                icon={<FileText className="h-5 w-5 text-amber-500" />}
                title="Resume Review"
                desc="Analyze my resume for ATS optimization and impact."
                onClick={() => handleNewChatWithPrompt("Could you review my resume and suggest improvements for ATS optimization and stronger impact statements?")}
              />
              <QuickStartCard 
                icon={<Target className="h-5 w-5 text-blue-500" />}
                title="Interview Prep"
                desc="Conduct a mock behavioral interview for a senior role."
                onClick={() => handleNewChatWithPrompt("I'd like to do a mock behavioral interview for a senior role. Please ask me a common question, wait for my response, and then give me feedback.")}
              />
            </div>
          </div>
        ) : (
          <ChatInterface sessionId={sessionId} />
        )}
      </div>
    </div>
  );

  function handleNewChatWithPrompt(prompt: string) {
    createSession.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (newSession) => {
          queryClient.invalidateQueries({ queryKey: getListChatSessionsQueryKey() });
          // Navigate and pass state to auto-send the prompt
          setLocation(`/chat/${newSession.id}`);
          // A bit hacky but effective: store initial prompt in sessionStorage to be picked up by the ChatInterface
          sessionStorage.setItem(`initial_prompt_${newSession.id}`, prompt);
        }
      }
    );
  }
}

function QuickStartCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-start p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/30 transition-all text-left group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-background border border-border shadow-sm group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </button>
  );
}