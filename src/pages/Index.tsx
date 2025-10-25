import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);
  const [nickname, setNickname] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
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
