import { useAuth, UserButton } from "@clerk/react";
import { Redirect, Link, useLocation } from "wouter";
import { LayoutDashboard, UploadCloud, Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { SkillzyLogo } from "./skillzy-logo";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Skillzy" className="w-12 h-12 object-contain animate-pulse" />
          <div className="w-6 h-6 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  const NavLinks = () => (
    <>
      <Link href="/dashboard">
        <Button
          variant={location === "/dashboard" ? "secondary" : "ghost"}
          className={`w-full justify-start gap-2 ${location === "/dashboard" ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/upload">
        <Button
          variant={location === "/upload" ? "secondary" : "ghost"}
          className={`w-full justify-start gap-2 ${location === "/upload" ? "bg-primary/10 text-primary hover:bg-primary/15" : ""}`}
        >
          <UploadCloud className="w-4 h-4" />
          Analyze Resume
        </Button>
      </Link>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <SkillzyLogo size={28} nameClassName="text-base" />
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col gap-4">
              <SkillzyLogo size={32} nameClassName="text-lg" className="mb-2" />
              <nav className="flex flex-col gap-2">
                <NavLinks />
              </nav>
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <UserButton />
              </div>
            </SheetContent>
          </Sheet>
          <UserButton />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        {/* Brand */}
        <div className="px-2 mb-8">
          <SkillzyLogo size={36} nameClassName="text-xl" />
          <p className="text-xs text-muted-foreground mt-1 ml-12">Skill Today. Shine Tomorrow.</p>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <NavLinks />
        </nav>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <UserButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
