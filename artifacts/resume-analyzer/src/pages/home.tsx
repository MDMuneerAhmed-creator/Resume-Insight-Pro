import { Link } from "wouter";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { FileSearch, Target, TrendingUp, ChevronRight } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background selection:bg-primary/20">
      <header className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="font-mono font-bold text-xl tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
            A
          </div>
          Analyzer
        </div>
        <nav className="flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="font-medium">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button className="font-medium">Get Started</Button>
              </Link>
            </>
          ) : (
            <Link href="/dashboard">
              <Button className="font-medium">Go to Dashboard</Button>
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            Beat the ATS filters
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Get your resume past the <span className="text-primary">robots.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop guessing what employers want. Our brutally honest analyzer reads your resume like an Applicant Tracking System and tells you exactly what skills you're missing.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {!isSignedIn ? (
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg font-medium group">
                  Start Analyzing Free
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg font-medium group">
                  Go to Dashboard
                  <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-32 text-left">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <FileSearch className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Analysis</h3>
            <p className="text-muted-foreground">Upload your PDF and get a comprehensive breakdown of your resume's strengths and weaknesses in seconds.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Skill Gap Detection</h3>
            <p className="text-muted-foreground">Discover exactly which industry keywords and skills you are missing to match the job descriptions you want.</p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Actionable Advice</h3>
            <p className="text-muted-foreground">Receive precise, actionable suggestions to reword your experience and improve your overall ATS score.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
        <p>Analyzer &copy; {new Date().getFullYear()}. Engineered for success.</p>
      </footer>
    </div>
  );
}
