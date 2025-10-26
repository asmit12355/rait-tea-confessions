import { Button } from "@/components/ui/button";
import teaLogo from "@/assets/tea-logo.png";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <img src={teaLogo} alt="Tea Cup" className="h-10 w-10 opacity-90" />
          <h1 className="text-xl font-semibold tracking-tight">RAIT Confession Tea</h1>
        </div>
        
        <Button className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 transition-opacity shadow-glow">
          Post a Secret
        </Button>
      </div>
    </header>
  );
};

export default Header;
