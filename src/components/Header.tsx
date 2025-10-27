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
      <div className="container px-4 py-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={teaLogo} alt="Tea Cup" className="h-10 w-10 opacity-90" />
            <h1 className="text-2xl font-semibold">RAIT Confession Tea</h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/")}
              variant={location.pathname === "/" ? "default" : "ghost"}
            >
              Home
            </Button>
            <Button
              onClick={() => navigate("/trending")}
              variant={location.pathname === "/trending" ? "default" : "ghost"}
            >
              Trending
            </Button>
            <Button
              onClick={onPostClick}
              className="bg-primary hover:bg-primary/90"
            >
              Post a Secret
            </Button>
            {user && isAdmin && (
              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                className="border-primary text-primary"
              >
                Admin
              </Button>
            )}
            {user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-border"
              >
                Sign Out
              </Button>
            ) : (
              <Button
                onClick={() => navigate("/auth")}
                variant="ghost"
              >
                Admin Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
