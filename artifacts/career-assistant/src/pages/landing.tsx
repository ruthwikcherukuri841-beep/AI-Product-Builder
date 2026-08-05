import { useAuth } from "@workspace/replit-auth-web";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Briefcase, ArrowRight, Sparkles, Target, Zap } from "lucide-react";
import { ThemeToggle } from "@/lib/theme-toggle";

export default function LandingPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation("/chat");
    }
  }, [isLoading, isAuthenticated, setLocation]);

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none opacity-50"></div>
      
      <header className="px-8 py-6 flex items-center justify-between z-10 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Briefcase className="h-4 w-4" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Lumina</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button onClick={login} variant="outline" className="rounded-full border-border/50 hover:bg-white/5 no-default-hover-elevate transition-all">
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 z-10 py-20">
        <div className="max-w-4xl w-full text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-4 w-4" />
            <span>The future of career coaching</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Your personal <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-300">executive coach.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            A precise, brilliant career advisor available 24/7. Review resumes, analyze skill gaps, and prepare for interviews with uncompromising clarity.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
            <Button onClick={login} size="lg" className="rounded-full h-14 px-8 text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95 text-primary-foreground">
              Start Coaching Session <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl w-full mt-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <FeatureCard 
            icon={<Target className="h-6 w-6 text-primary" />}
            title="Surgical Precision"
            desc="No fluff, no platitudes. Get actionable, tactical advice tailored to your exact industry and seniority level."
          />
          <FeatureCard 
            icon={<Briefcase className="h-6 w-6 text-primary" />}
            title="Context Aware"
            desc="Upload your resume and current job description once. Every conversation adapts to your unique background."
          />
          <FeatureCard 
            icon={<Zap className="h-6 w-6 text-primary" />}
            title="Always On"
            desc="Late night interview prep? Salary negotiation tomorrow morning? Your coach is ready whenever you are."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50 shadow-lg relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}