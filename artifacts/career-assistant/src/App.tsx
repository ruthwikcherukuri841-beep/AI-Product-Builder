import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import LandingPage from '@/pages/landing';
import ChatPage from '@/pages/chat';
import ProfilePage from '@/pages/profile';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { PrivateRoute } from '@/components/layout/private-route';
import { ThemeProvider } from '@/lib/theme-provider';
import { useAuth } from "@workspace/replit-auth-web";

const queryClient = new QueryClient();

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // Handle global loading if needed
  }
  
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/chat">
        <PrivateRoute>
          <ChatPage />
        </PrivateRoute>
      </Route>
      <Route path="/chat/:sessionId">
        <PrivateRoute>
          <ChatPage />
        </PrivateRoute>
      </Route>
      <Route path="/profile">
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="career-assistant-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;