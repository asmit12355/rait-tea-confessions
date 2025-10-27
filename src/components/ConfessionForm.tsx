import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface ConfessionFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ConfessionForm = ({ onClose, onSuccess }: ConfessionFormProps) => {
  const [pseudonym, setPseudonym] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const randomNumber = Math.floor(Math.random() * 10000);
      const authorName = pseudonym.trim() || `Anonymous User #${randomNumber}`;
      
      // Anonymous posting - no login required
      const { error } = await supabase.from("confessions").insert({
        user_id: null, // Anonymous
        author_name: authorName,
        title,
        content,
      });

      if (error) throw error;

      toast({ title: "Confession posted successfully!" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Post a Secret</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pseudonym">Pseudonym (Optional)</Label>
              <Input
                id="pseudonym"
                placeholder="Leave empty for Anonymous User #[number]"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give your confession a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your Confession</Label>
              <Textarea
                id="content"
                placeholder="Share your secret..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                className="bg-secondary border-border resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? "Posting..." : "Post Confession"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfessionForm;
