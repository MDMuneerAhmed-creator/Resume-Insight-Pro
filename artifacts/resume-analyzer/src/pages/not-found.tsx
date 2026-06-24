import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { SkillzyLogo } from "@/components/skillzy-logo";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 text-center bg-background">
      <SkillzyLogo size={56} showName={false} className="mb-6 opacity-30" />
      <h1 className="text-6xl font-bold tracking-tight mb-2 skillzy-gradient-text">404</h1>
      <p className="text-xl font-semibold text-foreground mb-2">Page not found</p>
      <p className="text-muted-foreground mb-8 max-w-sm text-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg" className="skillzy-gradient border-0 text-white hover:opacity-90">
          Back to Skillzy
        </Button>
      </Link>
    </div>
  );
}
