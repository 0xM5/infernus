import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [nickname, setNickname] = useState<string>("");

  useEffect(() => {
    const fetchNickname = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.warn("Error fetching nickname:", error);
          } else if (data?.nickname) {
            setNickname(data.nickname);
          }
        } catch (err) {
          console.warn("Exception fetching nickname:", err);
        }
      }
    };
    
    fetchNickname();
  }, [user]);

  useEffect(() => {
    if (user && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (user && countdown === 0) {
      navigate("/dashboard");
    }
  }, [countdown, user, navigate]);

  if (loading) {
    console.log("Index: Loading state");
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-foreground text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log("Index: Rendering unauthenticated landing page");
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-between bg-background text-foreground py-12 px-4">
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
              Infernus.app<span className="text-primary">.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Built for what traders{" "}
              <span className="relative inline-block">
                <span className="relative z-10">actually</span>
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary to-[hsl(263_70%_50%)] via-[hsl(0_84%_60%)]" style={{ background: 'linear-gradient(90deg, hsl(263 70% 50%), hsl(0 84% 60%))' }}></span>
              </span>{" "}
              need.
            </p>
            
            <div className="border border-border rounded-lg p-6 max-w-md mx-auto mt-8" style={{ backgroundColor: 'hsl(0 0% 7%)' }}>
              <p className="text-sm text-muted-foreground text-gray-300 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                Infernus.app is in private beta. It's being built for{" "}
                <span className="text-foreground text-white font-medium">traders who want to improve</span>,
                not traders who want to feel good about themselves.
              </p>
            </div>
            
            <Button 
              onClick={() => navigate("/auth")}
              size="lg"
              className="rounded-full px-8"
            >
              Login
            </Button>
          </div>
        </div>
        
        <footer className="text-sm text-muted-foreground text-gray-400 flex items-center gap-2 justify-center" style={{ fontFamily: 'Inter, sans-serif' }}>
          <span>Development by Alex Maksimiak</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          <span className="select-all cursor-pointer">mfve</span>
        </footer>
      </div>
    );
  }

  console.log("Index: Rendering authenticated welcome screen, countdown:", countdown);
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        <h1 className="text-4xl font-bold text-foreground text-white">
          Welcome Back, {nickname}
        </h1>
        <p className="text-2xl text-muted-foreground text-gray-400">
          Redirecting to Journal in {countdown}
        </p>
      </div>
    </div>
  );
};

export default Index;
