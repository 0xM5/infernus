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
        const { data } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .single();
        
        if (data?.nickname) {
          setNickname(data.nickname);
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
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-between bg-background text-foreground py-12 px-4">
        <div className="flex-1 flex flex-col items-center justify-center max-w-3xl w-full">
          <div className="text-center space-y-8">
            <h1 className="text-6xl font-bold" style={{ fontFamily: 'Inter, sans-serif' }}>
              Infernus.app
            </h1>
            
            <p className="text-xl text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
              Built for what traders{" "}
              <span className="underline decoration-2 underline-offset-4">actually</span>{" "}
              need.
            </p>
            
            <div className="border border-border rounded-lg p-6 bg-card max-w-md mx-auto">
              <p className="text-sm text-muted-foreground leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
                Infernus.app is in private beta. It's being built for{" "}
                <span className="text-foreground font-medium">traders who want to improve</span>,
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
        
        <footer className="text-sm text-muted-foreground" style={{ fontFamily: 'Inter, sans-serif' }}>
          Development by 💀 mfve
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4" style={{ fontFamily: 'Inter, sans-serif' }}>
        <h1 className="text-4xl font-bold text-foreground">
          Welcome Back, {nickname}
        </h1>
        <p className="text-2xl text-muted-foreground">
          Redirecting to Journal in {countdown}
        </p>
      </div>
    </div>
  );
};

export default Index;
