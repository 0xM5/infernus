import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [countdown, setCountdown] = useState(3);

  // If user is already authenticated, redirect to journal after 3 seconds
  useEffect(() => {
    if (user && !loading) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative" style={{ background: "linear-gradient(to bottom, #000000, #0a0a0a)" }}>
      <div className="flex flex-col items-center gap-3 text-center px-4">
        {/* Main Title */}
        <h1 className="text-6xl font-bold text-foreground" style={{ fontFamily: 'Inter', fontWeight: 700 }}>
          Infernus.app
        </h1>
        
        {/* Tagline */}
        <p className="text-2xl text-muted-foreground" style={{ fontFamily: 'Inter', fontWeight: 500 }}>
          Built for what traders{' '}
          <span className="relative inline-block">
            actually
            <span 
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ 
                background: 'linear-gradient(to right, hsl(250, 70%, 60%), hsl(0, 70%, 60%))'
              }}
            />
          </span>
        {' '}need.
        </p>
        
        {/* Beta Message Box */}
        <div className="border border-muted-foreground/30 rounded-md px-8 py-4 max-w-md mt-6">
          <p className="text-muted-foreground" style={{ fontFamily: 'Inter', fontWeight: 400 }}>
            Infernus is currently in a private beta phase. Please check back soon for public access.
          </p>
        </div>
        
        {/* Login Button - Only show if not authenticated */}
        {!user && (
          <Button 
            onClick={() => navigate('/auth')}
            className="text-white font-semibold px-8 py-3 text-lg rounded-xl"
            style={{ 
              backgroundColor: 'rgb(57, 57, 57)',
              fontFamily: 'Inter'
            }}
          >
            Login
          </Button>
        )}
        
        {/* Show countdown message if authenticated */}
        {user && (
          <div className="text-muted-foreground text-lg" style={{ fontFamily: 'Inter' }}>
            Redirecting to journal in {countdown}...
          </div>
        )}
        
        {/* Discord Contact */}
        <div className="flex items-center gap-2 text-muted-foreground mt-4">
          <span style={{ fontFamily: 'Inter' }}>Development by</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 127.14 96.36"
            className="w-5 h-5"
            fill="currentColor"
          >
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          <span style={{ fontFamily: 'Inter' }}>mfve</span>
        </div>
      </div>
    </div>
  );
};

export default Index;
