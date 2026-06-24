import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { SkillzyLogo } from "@/components/skillzy-logo";
import { FileSearch, Target, TrendingUp, ChevronRight, Sparkles } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      {/* Navbar */}
      <header className="container mx-auto px-4 h-16 flex items-center justify-between">
        <SkillzyLogo size={36} nameClassName="text-xl" />
        <nav className="flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="font-medium skillzy-gradient border-0 text-white hover:opacity-90">Get Started</Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <Button className="font-medium skillzy-gradient border-0 text-white hover:opacity-90">Go to Dashboard</Button>
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
            <Sparkles className="w-4 h-4" />
            AI-Powered Resume Intelligence
          </div>

          {/* Logo mark */}
          <div className="flex justify-center">
            <img src="/logo.png" alt="Skillzy" className="w-24 h-24 object-contain drop-shadow-lg" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-tight">
            <span className="skillzy-gradient-text">Skill Today.</span>
            <br />
            Shine Tomorrow.
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Upload your resume and let Skillzy's AI read it exactly like an ATS. Get your score, pinpoint skill gaps, and get the interviews you deserve.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {!isSignedIn ? (
              <>
                <Link href="/sign-up">
                  <Button size="lg" className="h-14 px-10 text-lg font-semibold group skillzy-gradient border-0 text-white hover:opacity-90 shadow-lg shadow-primary/30">
                    Analyze My Resume Free
                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium">
                    Sign In
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-10 text-lg font-semibold group skillzy-gradient border-0 text-white hover:opacity-90">
                  Go to Dashboard
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>

          {/* Social proof */}
          <p className="text-sm text-muted-foreground">No credit card required · Results in under 30 seconds</p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-28 text-left w-full px-4">
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl skillzy-gradient flex items-center justify-center mb-5 shadow-md shadow-primary/20">
              <FileSearch className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Instant ATS Score</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Get a 0–100 ATS compatibility score and a full breakdown of your resume's strengths and weak points in seconds.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl skillzy-gradient flex items-center justify-center mb-5 shadow-md shadow-primary/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Skill Gap Detection</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Discover exactly which industry keywords and skills are missing from your resume to match the jobs you want.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl skillzy-gradient flex items-center justify-center mb-5 shadow-md shadow-primary/20">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Actionable Advice</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">Receive precise, AI-generated suggestions to reword your experience and boost your overall ATS score.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <div className="flex items-center justify-center gap-2 mb-2">
          <SkillzyLogo size={20} nameClassName="text-sm" />
        </div>
        <p>&copy; {new Date().getFullYear()} Skillzy. Skill Today. Shine Tomorrow.</p>
      </footer>
    </div>
  );
}
