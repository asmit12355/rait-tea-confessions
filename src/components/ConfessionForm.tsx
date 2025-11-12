import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { getDeviceInfo } from "@/lib/deviceInfo";
import { getClientIP, createSlug } from "@/lib/utils";

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
      const deviceInfo = getDeviceInfo();
      const ipAddress = await getClientIP();
      const slug = createSlug(title);
      
      // Anonymous posting - no login required
      const { error } = await supabase.from("confessions").insert({
        user_id: null, // Anonymous
        author_name: authorName,
        title,
        content,
        device_info: deviceInfo,
        ip_address: ipAddress,
        slug: slug,
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 md:p-4 z-50">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl md:text-2xl font-semibold font-display">Post a Secret</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-secondary h-8 w-8 md:h-10 md:w-10"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="pseudonym" className="text-sm md:text-base">Pseudonym (Optional)</Label>
              <Input
                id="pseudonym"
                placeholder="Leave empty for Anonymous User #[number]"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                className="bg-secondary border-border text-sm md:text-base"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="title" className="text-sm md:text-base">Title</Label>
              <Input
                id="title"
                placeholder="Give your confession a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-secondary border-border text-sm md:text-base"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <Label htmlFor="content" className="text-sm md:text-base">Your Confession</Label>
              <Textarea
                id="content"
                placeholder="Share your secret..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="bg-secondary border-border resize-none text-sm md:text-base"
              />
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-2 md:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 text-sm md:text-base"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary hover:bg-primary/90 text-sm md:text-base"
              >
                {loading ? "Posting..." : "Post Confession"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfessionForm;
