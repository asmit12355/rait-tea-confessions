import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { Download, Share2 } from "lucide-react";

interface ThemedShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confession: {
    title: string;
    content: string;
    author: string;
    tags?: string[];
  };
  shareUrl: string;
}

const themes = [
  {
    id: "gradient-purple",
    name: "Purple Dream",
    bgClass: "bg-gradient-to-br from-purple-500 via-pink-500 to-red-500",
    textClass: "text-white",
  },
  {
    id: "gradient-ocean",
    name: "Ocean Blue",
    bgClass: "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500",
    textClass: "text-white",
  },
  {
    id: "gradient-sunset",
    name: "Sunset",
    bgClass: "bg-gradient-to-br from-orange-400 via-red-500 to-pink-600",
    textClass: "text-white",
  },
  {
    id: "dark-elegant",
    name: "Dark Elegant",
    bgClass: "bg-gradient-to-br from-gray-900 via-gray-800 to-black",
    textClass: "text-white",
  },
  {
    id: "light-minimal",
    name: "Light Minimal",
    bgClass: "bg-gradient-to-br from-gray-50 via-white to-gray-100",
    textClass: "text-gray-900",
  },
];

const ThemedShareDialog = ({
  open,
  onOpenChange,
  confession,
  shareUrl,
}: ThemedShareDialogProps) => {
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("share-card");
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
      });

      const link = document.createElement("a");
      link.download = `confession-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success("Image downloaded!");
    } catch (error) {
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: confession.title,
          text: confession.content.slice(0, 100) + "...",
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Share Confession</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="mb-2 block">Choose Theme</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTheme.id === theme.id
                      ? "border-primary scale-95"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className={`w-full h-12 rounded ${theme.bgClass} mb-1`} />
                  <p className="text-xs text-center">{theme.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 bg-secondary">
            <p className="text-xs text-muted-foreground mb-3">Preview:</p>
            <div
              id="share-card"
              className={`${selectedTheme.bgClass} ${selectedTheme.textClass} p-6 rounded-lg space-y-4 min-h-[300px] flex flex-col justify-between`}
            >
              <div className="space-y-3">
                <h3 className="font-bold text-xl line-clamp-2">{confession.title}</h3>
                <p className="text-sm opacity-90 line-clamp-4">{confession.content}</p>
                {confession.tags && confession.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {confession.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-white/20 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm opacity-75">
                <span>- {confession.author}</span>
                <span>🍵 Tea Confessions</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Download"}
            </Button>
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemedShareDialog;
