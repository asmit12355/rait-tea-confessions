import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import teaLogo from "@/assets/tea-logo.png";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  onPostClick: () => void;
}

const Header = ({ onPostClick }: HeaderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <img src={teaLogo} alt="Tea Cup" className="h-10 w-10" />
          <h1 className="text-xl font-medium tracking-tight">RAIT Confession Tea</h1>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button onClick={onPostClick} className="bg-primary hover:bg-primary/90">
                Post a Secret
              </Button>
              <Button onClick={handleSignOut} variant="ghost">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} variant="ghost">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
