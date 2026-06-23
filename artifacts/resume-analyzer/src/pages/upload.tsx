import { useState, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, File, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function Upload() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return false;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.id) return;
    
    setIsUploading(true);
    setUploadProgress(10);
    setError(null);
    
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      formData.append("fileName", file.name);

      setUploadProgress(30);

      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(70);

      if (!response.ok) {
        throw new Error(await response.text() || "Upload failed");
      }

      const data = await response.json();
      setUploadProgress(100);
      
      toast({
        title: "Success",
        description: "Resume uploaded successfully. Analysis started.",
      });

      // Navigate to detail page
      setTimeout(() => {
        setLocation(`/resumes/${data.id}`);
      }, 500);
      
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground mt-2">Submit your latest resume in PDF format for deep ATS analysis.</p>
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
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="application/pdf"
                onChange={handleFileChange}
              />
              <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-lg font-semibold mb-1">Click or drag and drop</h3>
              <p className="text-sm text-muted-foreground">PDF (MAX. 5MB)</p>
            </div>
          ) : (
            <div className="border rounded-xl p-6 bg-card flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center shrink-0">
                  <File className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading & Analyzing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              ) : (
                <Button onClick={handleUpload} size="lg" className="w-full">
                  Analyze Document
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex gap-3 items-start p-4 rounded-lg bg-muted/50 border border-border/50">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-1">Standard ATS Formatting</span>
            <span className="text-muted-foreground">Ensure your PDF uses standard fonts and single-column layout for best results.</span>
          </div>
        </div>
        <div className="flex gap-3 items-start p-4 rounded-lg bg-muted/50 border border-border/50">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-1">Include Keywords</span>
            <span className="text-muted-foreground">The analyzer extracts exact matches. Tailor your resume to specific job descriptions.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
