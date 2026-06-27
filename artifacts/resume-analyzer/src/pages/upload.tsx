import { useState, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDashboardStatsQueryKey, getGetSkillGapsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, AlertCircle, X, CheckCircle2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function Upload() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((f: File): boolean => {
    if (f.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError("File size must be under 5MB.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && validateFile(dropped)) setFile(dropped);
  }, [validateFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) setFile(selected);
    e.target.value = "";
  }, [validateFile]);

  const handleUpload = async () => {
    if (!file || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const token = await getToken();

console.log("========== CLERK DEBUG ==========");

console.log("User ID:", user?.id);

console.log("Token:", token);

if (!token) {

  throw new Error("Authentication failed. Please sign in again.");
}

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);

      setUploadProgress(35);
      console.log("Sending Authorization header...");

      console.log("Authorization:", `Bearer ${token}`);

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      setUploadProgress(75);

      if (!response.ok) {
        let msg = "Upload failed";
        try { msg = ((await response.json()) as { error?: string }).error ?? msg; }
        catch { msg = await response.text() || msg; }
        throw new Error(msg);
      }

      const data = await response.json() as { id: number };
      setUploadProgress(100);

      if (user.id) {
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey({ userId: user.id }) });
        queryClient.invalidateQueries({ queryKey: getGetSkillGapsQueryKey({ userId: user.id }) });
      }

      toast({ title: "Uploaded!", description: "Skillzy is analyzing your resume now." });
      setTimeout(() => setLocation(`/resumes/${data.id}`), 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-start gap-4">
        <img src="/logo.png" alt="Skillzy" className="w-12 h-12 object-contain shrink-0 mt-1" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyze Your Resume</h1>
          <p className="text-muted-foreground mt-1">Upload your PDF and Skillzy's AI will give you a full ATS analysis in seconds.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!file ? (
            <div
              role="button"
              aria-label="Upload PDF resume"
              tabIndex={0}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all select-none
                ${isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"
                }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf" onChange={handleFileChange} aria-hidden="true" />
              <div className={`w-16 h-16 rounded-2xl skillzy-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20 transition-transform ${isDragging ? "scale-110" : ""}`}>
                <UploadCloud className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-semibold mb-1">Drop your resume here</p>
              <p className="text-sm text-muted-foreground">or <span className="text-primary underline underline-offset-2 cursor-pointer">click to browse</span></p>
              <p className="text-xs text-muted-foreground mt-3 bg-muted/50 inline-block px-3 py-1 rounded-full">PDF only · Max 5MB</p>
            </div>
          ) : (
            <div className="border rounded-2xl p-6 bg-primary/5 border-primary/20 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl skillzy-gradient flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="icon" onClick={() => { setFile(null); setError(null); }} className="shrink-0 text-muted-foreground hover:text-destructive" aria-label="Remove file">
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                      Skillzy is analyzing…
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              ) : (
                <Button onClick={handleUpload} size="lg" className="w-full gap-2 skillzy-gradient border-0 text-white hover:opacity-90 shadow-md shadow-primary/20">
                  <Sparkles className="w-4 h-4" />
                  Analyze with Skillzy AI
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex gap-3 items-start p-4 rounded-xl bg-muted/40 border border-border/50">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">ATS-Friendly Format</p>
            <p className="text-muted-foreground text-xs leading-relaxed">Use standard fonts and a single-column layout for the highest ATS compatibility score.</p>
          </div>
        </div>
        <div className="flex gap-3 items-start p-4 rounded-xl bg-muted/40 border border-border/50">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Keyword Matching</p>
            <p className="text-muted-foreground text-xs leading-relaxed">Tailor your resume with keywords from the job description for higher Skillzy scores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
