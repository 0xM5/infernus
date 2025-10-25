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
          <div className="text-center space-y-8">
            <h1 className="text-6xl font-bold text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
              Infernus.app
            </h1>
            
            <p className="text-xl text-muted-foreground text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
              Built for what traders{" "}
              <span className="underline decoration-2 underline-offset-4">actually</span>{" "}
              need.
            </p>
            
            <div className="border border-border rounded-lg p-6 bg-card max-w-md mx-auto">
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
        
        <footer className="text-sm text-muted-foreground text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
          Development by 💀 mfve
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
