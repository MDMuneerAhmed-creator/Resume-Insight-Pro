import { useState, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetDashboardStatsQueryKey, getGetSkillGapsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  const validateFile = useCallback((selectedFile: File): boolean => {
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size must be under 5MB.");
      return false;
    }
    setError(null);
    return true;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && validateFile(dropped)) setFile(dropped);
  }, [validateFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && validateFile(selected)) setFile(selected);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [validateFile]);

  const handleUpload = async () => {
    if (!file || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication failed. Please sign in again.");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);

      setUploadProgress(30);

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      setUploadProgress(70);

      if (!response.ok) {
        let errMsg = "Upload failed";
        try {
          const errData = await response.json() as { error?: string };
          errMsg = errData.error ?? errMsg;
        } catch {
          errMsg = await response.text() || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await response.json() as { id: number };
      setUploadProgress(100);

      // Invalidate dashboard cache so it refreshes when user navigates back
      if (user.id) {
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey({ userId: user.id }) });
        queryClient.invalidateQueries({ queryKey: getGetSkillGapsQueryKey({ userId: user.id }) });
      }

      toast({
        title: "Uploaded successfully",
        description: "Analysis has started. Results will appear in a few seconds.",
      });

      setTimeout(() => setLocation(`/resumes/${data.id}`), 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analyze Resume</h1>
        <p className="text-muted-foreground mt-2">Upload your resume in PDF format for a deep ATS compatibility analysis.</p>
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
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all select-none
                ${isDragging
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40"
                }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
                aria-hidden="true"
              />
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-lg font-semibold mb-1">Drop your resume here</p>
              <p className="text-sm text-muted-foreground">or <span className="text-primary underline underline-offset-2">click to browse</span></p>
              <p className="text-xs text-muted-foreground mt-3">PDF only · Max 5MB</p>
            </div>
          ) : (
            <div className="border rounded-xl p-6 bg-muted/30 flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setFile(null); setError(null); }}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Uploading & starting analysis…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              ) : (
                <Button onClick={handleUpload} size="lg" className="w-full gap-2">
                  <UploadCloud className="w-4 h-4" />
                  Analyze Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="flex gap-3 items-start p-4 rounded-lg bg-muted/40 border border-border/50">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Standard ATS Formatting</p>
            <p className="text-muted-foreground">Use standard fonts and a single-column layout for the best ATS compatibility.</p>
          </div>
        </div>
        <div className="flex gap-3 items-start p-4 rounded-lg bg-muted/40 border border-border/50">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">Include Keywords</p>
            <p className="text-muted-foreground">Tailor your resume with keywords from the job description for higher scores.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
