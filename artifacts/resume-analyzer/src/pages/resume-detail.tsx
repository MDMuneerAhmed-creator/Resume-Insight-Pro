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
  FolderKanban,
  Sparkles
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
        refetchInterval: (query) => {
          const data = query.state.data as { status?: string } | undefined;
          if (data?.status === "pending" || data?.status === "analyzing") return 3000;
          return false;
        },
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
      onError: () => toast({ title: "Failed to delete resume", variant: "destructive" }),
    }
  });

  const reanalyzeMutation = useReanalyzeResume({
    mutation: {
      onSuccess: () => {
        toast({ title: "Re-analysis started!", description: "Skillzy is re-reading your resume." });
        queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey(resumeId) });
      },
      onError: () => toast({ title: "Failed to start re-analysis", variant: "destructive" }),
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3 flex-wrap">
              <span className="break-all">{resume.fileName}</span>
              {isAnalyzing && <Badge variant="secondary" className="animate-pulse bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 shrink-0">Analyzing…</Badge>}
              {isFailed && <Badge variant="destructive" className="shrink-0">Failed</Badge>}
              {resume.status === "done" && <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shrink-0 border-green-500/20">Analyzed</Badge>}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Uploaded {format(new Date(resume.uploadedAt), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="gap-2"
            disabled={isAnalyzing || reanalyzeMutation.isPending}
            onClick={() => reanalyzeMutation.mutate({ id: resumeId })}
          >
            <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`} />
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

      {/* Analyzing State */}
      {isAnalyzing && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <img src="/logo.png" alt="Skillzy" className="w-16 h-16 object-contain mb-4 animate-pulse" />
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h3 className="text-xl font-bold">Skillzy is analyzing your resume</h3>
            </div>
            <p className="text-muted-foreground max-w-md text-sm">Our AI is reading your document, extracting skills, and generating personalized suggestions. This takes 10–30 seconds.</p>
            <p className="text-xs text-muted-foreground mt-4 bg-primary/10 px-4 py-1.5 rounded-full">This page will update automatically.</p>
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {isFailed && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="w-10 h-10 text-destructive mb-3" />
            <h3 className="text-lg font-bold mb-2 text-destructive">Analysis Failed</h3>
            <p className="text-muted-foreground mb-4 text-sm">Something went wrong during analysis. Click Re-analyze to try again.</p>
            <Button
              variant="outline"
              className="gap-2"
              disabled={reanalyzeMutation.isPending}
              onClick={() => reanalyzeMutation.mutate({ id: resumeId })}
            >
              <RefreshCw className={`w-4 h-4 ${reanalyzeMutation.isPending ? "animate-spin" : ""}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {resume.status === "done" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-1">
            {/* Score Card */}
            <Card className="overflow-hidden">
              <div className="h-1 skillzy-gradient" />
              <CardHeader className="text-center pb-2 pt-6">
                <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">ATS Score</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-8 pt-2">
                <CircularProgress value={resume.atsScore ?? 0} size={180} strokeWidth={12} />
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Detected Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No specific skills detected.</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Skills */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <XCircle className="w-4 h-4" />
                  Missing Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map(skill => (
                      <Badge key={skill} variant="outline" className="px-2.5 py-1 border-destructive/30 text-destructive bg-background text-xs">
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

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Skillzy's Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.length > 0 ? (
                  <ul className="space-y-3">
                    {suggestions.map((s, i) => (
                      <li key={i} className="flex gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                        <div className="w-6 h-6 rounded-full skillzy-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm leading-relaxed">{s}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">No specific suggestions generated.</p>
                )}
              </CardContent>
            </Card>

            {/* Extracted Content */}
            <Card>
              <CardHeader>
                <CardTitle>Extracted Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    Experience
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-xl border border-border/50 font-mono leading-relaxed">
                    {resume.experience || "No experience section clearly identified."}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    Education
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-xl border border-border/50 font-mono leading-relaxed">
                    {resume.education || "No education section clearly identified."}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    Projects
                  </h3>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted/30 rounded-xl border border-border/50 font-mono leading-relaxed">
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
