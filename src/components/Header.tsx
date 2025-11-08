import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Home, TrendingUp, Shield, LogOut, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import teaLogo from "@/assets/tea-logo.png";

interface HeaderProps {
  onPostClick: () => void;
}

const Header = ({ onPostClick }: HeaderProps) => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

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
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                onClick={() => navigate("/")}
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
              >
                Home
              </Button>
              <Button
                onClick={() => navigate("/trending")}
                variant={location.pathname === "/trending" ? "default" : "ghost"}
                size="sm"
              >
                Trending
              </Button>
              <Button
                onClick={onPostClick}
                className="bg-primary hover:bg-primary/90 font-semibold"
                size="sm"
              >
                Post Secret
              </Button>
              {user && isAdmin && (
                <Button
                  onClick={() => navigate("/admin")}
                  variant="outline"
                  className="border-primary text-primary"
                  size="sm"
                >
                  Admin
                </Button>
              )}
              {user && (
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-border"
                  size="sm"
                >
                  Sign Out
                </Button>
              )}
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="ghost"
                size="sm"
                className="px-2"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                variant="ghost"
                size="sm"
                className="px-2"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                onClick={onPostClick}
                className="bg-primary hover:bg-primary/90 text-xs font-semibold"
                size="sm"
              >
                Post Secret
              </Button>
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <nav className="flex flex-col gap-4 mt-8">
                    <Button
                      onClick={() => {
                        navigate("/");
                        setMobileMenuOpen(false);
                      }}
                      variant={location.pathname === "/" ? "default" : "ghost"}
                      className="justify-start gap-2"
                    >
                      <Home className="h-4 w-4" />
                      Home
                    </Button>
                    <Button
                      onClick={() => {
                        navigate("/trending");
                        setMobileMenuOpen(false);
                      }}
                      variant={location.pathname === "/trending" ? "default" : "ghost"}
                      className="justify-start gap-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Trending
                    </Button>
                    {user && isAdmin && (
                      <Button
                        onClick={() => {
                          navigate("/admin");
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="justify-start gap-2 border-primary text-primary"
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </Button>
                    )}
                    {user && (
                      <Button
                        onClick={() => {
                          handleSignOut();
                          setMobileMenuOpen(false);
                        }}
                        variant="outline"
                        className="justify-start gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </Button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
