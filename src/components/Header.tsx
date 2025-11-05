import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import teaLogo from "@/assets/tea-logo.png";

interface HeaderProps {
  onPostClick: () => void;
}

const Header = ({ onPostClick }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container px-3 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={teaLogo} alt="Tea Cup" className="h-8 w-8 md:h-10 md:w-10 opacity-90" />
            <h1 className="text-lg md:text-2xl font-semibold font-display">RAIT Confession Tea</h1>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <Button
              onClick={() => navigate("/")}
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="sm"
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden">🏠</span>
            </Button>
            <Button
              onClick={() => navigate("/trending")}
              variant={location.pathname === "/trending" ? "default" : "ghost"}
              size="sm"
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Trending</span>
              <span className="sm:hidden">🔥</span>
            </Button>
            <Button
              onClick={onPostClick}
              className="bg-primary hover:bg-primary/90 text-xs md:text-sm font-semibold"
              size="sm"
            >
              Post Secret
            </Button>
            {user && isAdmin && (
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="border-primary text-primary hidden md:flex"
                size="sm"
              >
                Admin
              </Button>
            )}
            {user && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-border hidden md:flex"
                size="sm"
              >
                Sign Out
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
