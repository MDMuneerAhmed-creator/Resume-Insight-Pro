import { useAuth, UserButton } from "@clerk/react";
import { Redirect, Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  UploadCloud, 
  Moon, 
  Sun,
  Menu
} from "lucide-react";
import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
          className="w-full justify-start gap-2"
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </Button>
      </Link>
      <Link href="/upload">
        <Button 
          variant={location === "/upload" ? "secondary" : "ghost"} 
          className="w-full justify-start gap-2"
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
        <div className="font-mono font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
            A
          </div>
          Analyzer
        </div>
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4 flex flex-col gap-4">
              <div className="font-mono font-bold text-lg tracking-tight mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground text-xs">
                  A
                </div>
                Analyzer
              </div>
              <nav className="flex flex-col gap-2">
                <NavLinks />
              </nav>
            </SheetContent>
          </Sheet>
          <UserButton />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        <div className="font-mono font-bold text-xl tracking-tight mb-8 flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
            A
          </div>
          Analyzer
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <NavLinks />
        </nav>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border px-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
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
