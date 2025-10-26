import Header from "@/components/Header";
import ConfessionCard from "@/components/ConfessionCard";

const confessions = [
  {
    id: 1,
    author: "Anonymous Student",
    timestamp: "2 hours ago",
    title: "First Year Struggles",
    content: "I pretend to understand everything in lectures but I'm completely lost. Everyone seems so confident and I feel like I'm the only one struggling. Sometimes I wonder if I even belong here.",
    upvotes: 47,
    downvotes: 2,
    comments: 12,
  },
  {
    id: 2,
    author: "Night Owl",
    timestamp: "5 hours ago",
    title: "Cafeteria Confession",
    content: "I've been eating alone in the library instead of the cafeteria because I'm too anxious to sit with people. I tell my roommate I'm studying during lunch but I'm just hiding.",
    upvotes: 89,
    downvotes: 0,
    comments: 24,
  },
  {
    id: 3,
    author: "Stressed Senior",
    timestamp: "8 hours ago",
    title: "Placement Pressure",
    content: "My parents think I have multiple job offers but I haven't even gotten a single interview call. The pressure is crushing me and I don't know how to tell them the truth.",
    upvotes: 156,
    downvotes: 3,
    comments: 38,
  },
  {
    id: 4,
    author: "Midnight Coder",
    timestamp: "12 hours ago",
    title: "Copy-Paste Developer",
    content: "I've been copying code from Stack Overflow for all my assignments. My grades are great but I barely understand what I'm submitting. I'm terrified of technical interviews.",
    upvotes: 203,
    downvotes: 15,
    comments: 67,
  },
  {
    id: 5,
    author: "Quiet Observer",
    timestamp: "1 day ago",
    title: "Unrequited Campus Crush",
    content: "I've been in love with someone from my class for two years. They don't know I exist. I've never even had the courage to say hi. Graduation is in a few months and I'll probably never see them again.",
    upvotes: 134,
    downvotes: 5,
    comments: 29,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Recent Secrets
            </h2>
            <p className="text-muted-foreground">
              A safe space to share your anonymous confessions
            </p>
          </div>

          <div className="space-y-6">
            {confessions.map((confession) => (
              <ConfessionCard key={confession.id} {...confession} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
