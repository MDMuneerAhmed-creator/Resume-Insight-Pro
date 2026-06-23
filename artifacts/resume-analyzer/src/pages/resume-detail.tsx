import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { 
  useGetResume, 
  useDeleteResume, 
  useReanalyzeResume,
  getGetResumeQueryKey,
  getListResumesQueryKey,
  getGetDashboardStatsQueryKey,
  getGetSkillGapsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Separator } from "@/components/ui/separator";
import { 
  Trash2, 
  RefreshCw, 
  ArrowLeft, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Briefcase,
  GraduationCap,
  FolderKanban
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function parseJsonArray(str: string | null | undefined): string[] {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ResumeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resumeId = parseInt(id || "0", 10);

  const { data: resume, isLoading, error } = useGetResume(
    resumeId,
    {
      query: {
        enabled: !!resumeId,
        queryKey: getGetResumeQueryKey(resumeId),
        // Poll every 3 seconds while analysis is in progress
        refetchInterval: (query) => {
          const data = query.state.data as { status?: string } | undefined;
          if (data?.status === "pending" || data?.status === "analyzing") {
            return 3000;
          }
          return false;
        },
        // When analysis completes, invalidate dashboard so stats update
        select: (data) => {
          if (data?.status === "done" && user?.id) {
            queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey({ userId: user.id }) });
            queryClient.invalidateQueries({ queryKey: getGetSkillGapsQueryKey({ userId: user.id }) });
          }
          return data;
        },
      },
    }
  );

  const deleteMutation = useDeleteResume({
    mutation: {
      onSuccess: () => {
        toast({ title: "Resume deleted" });
        if (user?.id) {
          queryClient.invalidateQueries({ queryKey: getListResumesQueryKey({ userId: user.id }) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey({ userId: user.id }) });
          queryClient.invalidateQueries({ queryKey: getGetSkillGapsQueryKey({ userId: user.id }) });
        }
        setLocation("/dashboard");
      },
      onError: () => {
        toast({ title: "Failed to delete resume", variant: "destructive" });
      }
    }
  });

  const reanalyzeMutation = useReanalyzeResume({
    mutation: {
      onSuccess: () => {
        toast({ title: "Re-analysis started. Please wait." });
        queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) });
      },
      onError: () => {
        toast({ title: "Failed to start re-analysis", variant: "destructive" });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="w-10 h-10" />
          <div className="space-y-2">
            <Skeleton className="w-64 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-1 h-96" />
          <Skeleton className="lg:col-span-2 h-96" />
        </div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load resume details. It may have been deleted.</AlertDescription>
      </Alert>
    );
  }

  const skills = parseJsonArray(resume.skills);
  const missingSkills = parseJsonArray(resume.missingSkills);
  const suggestions = parseJsonArray(resume.suggestions);

  const isAnalyzing = resume.status === "pending" || resume.status === "analyzing";
  const isFailed = resume.status === "failed";

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 flex-wrap">
              <span className="break-all">{resume.fileName}</span>
              {isAnalyzing && <Badge variant="secondary" className="animate-pulse bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 shrink-0">Analyzing...</Badge>}
              {isFailed && <Badge variant="destructive" className="shrink-0">Failed</Badge>}
              {resume.status === "done" && <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shrink-0">Analyzed</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Uploaded on {format(new Date(resume.uploadedAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="outline" 
            className="gap-2"
            disabled={isAnalyzing || reanalyzeMutation.isPending}
            onClick={() => reanalyzeMutation.mutate({ id: resumeId })}
            title="Re-analyze this resume"
          >
            <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
            Re-analyze
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Resume</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{resume.fileName}</strong>? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteMutation.mutate({ id: resumeId })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isAnalyzing && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold mb-2">Analyzing your resume</h3>
            <p className="text-muted-foreground">Our AI is reading your document, extracting skills, and generating suggestions. This usually takes 10–30 seconds.</p>
            <p className="text-xs text-muted-foreground mt-4">This page will update automatically.</p>
          </CardContent>
        </Card>
      )}

      {isFailed && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <h3 className="text-lg font-bold mb-2 text-destructive">Analysis Failed</h3>
            <p className="text-muted-foreground mb-4 text-sm">Something went wrong while analyzing this resume. You can try again by clicking Re-analyze.</p>
            <Button 
              variant="outline"
              className="gap-2"
              disabled={reanalyzeMutation.isPending}
              onClick={() => reanalyzeMutation.mutate({ id: resumeId })}
            >
              <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {resume.status === "done" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Score & Skills */}
          <div className="space-y-8 lg:col-span-1">
            <Card className="bg-card border-border overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-500" />
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-lg text-muted-foreground uppercase tracking-wider">Overall ATS Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-8 pt-4">
                <CircularProgress value={resume.atsScore ?? 0} size={180} strokeWidth={12} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Detected Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="px-3 py-1 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No specific skills detected.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="w-5 h-5" />
                  Missing Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map(skill => (
                      <Badge key={skill} variant="outline" className="px-3 py-1 border-destructive/30 text-destructive bg-background">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No major skill gaps identified.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Suggestions & Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Improvement Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <ul className="space-y-4">
                    {suggestions.map((suggestion, i) => (
                      <li key={i} className="flex gap-4 p-4 rounded-lg bg-muted/50 border border-border">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-foreground text-sm leading-relaxed">{suggestion}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No specific suggestions generated.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Extracted Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Experience
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-lg border border-border/50 font-mono leading-relaxed">
                    {resume.experience || "No experience section clearly identified."}
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Education
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-lg border border-border/50 font-mono leading-relaxed">
                    {resume.education || "No education section clearly identified."}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                    <FolderKanban className="w-5 h-5 text-primary" />
                    Projects
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-lg border border-border/50 font-mono leading-relaxed">
                    {resume.projects || "No projects section clearly identified."}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
