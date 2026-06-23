import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight mb-2">404 - Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg">Return to Home</Button>
      </Link>
    </div>
  );
}
