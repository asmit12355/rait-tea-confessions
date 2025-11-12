import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostConfessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PostConfessionDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: PostConfessionDialogProps) => {
  const [authorName, setAuthorName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to post");
        return;
      }

      const { error } = await supabase.from("confessions").insert({
        user_id: user.id,
        author_name: authorName,
        title,
        content,
      });

      if (error) throw error;

      toast.success("Confession posted successfully!");
      setAuthorName("");
      setTitle("");
      setContent("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Post a Secret</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="author">Pseudonym</Label>
            <Input
              id="author"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Anonymous Student"
              required
              maxLength={50}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short title for your confession"
              required
              maxLength={100}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="content">Confession</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts anonymously..."
              required
              maxLength={2000}
              rows={6}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PostConfessionDialog;

// SEO Head component for dynamic meta tags
interface SEOHeadProps {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export const updateSEOTags = ({ title, description, url, image }: SEOHeadProps) => {
  // Update page title
  document.title = `${title} - RAIT Confession Tea`;
  
  // Update or create meta tags
  const metaTags = [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: "article" },
    { property: "og:site_name", content: "RAIT Confession Tea" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "description", content: description },
  ];

  if (image) {
    metaTags.push(
      { property: "og:image", content: image },
      { name: "twitter:image", content: image }
    );
  }

  metaTags.forEach(({ property, name, content }) => {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
    let element = document.querySelector(selector);
    
    if (!element) {
      element = document.createElement("meta");
      if (property) {
        element.setAttribute("property", property);
      } else if (name) {
        element.setAttribute("name", name);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute("content", content);
  });
};

export const SEOHead = ({ title, description, url, image }: SEOHeadProps) => {
  useEffect(() => {
    updateSEOTags({ title, description, url, image });
  }, [title, description, url, image]);

  return null;
};
