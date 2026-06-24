import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { format } from "date-fns";
import {
  useGetDashboardStats,
  useGetSkillGaps,
  getGetDashboardStatsQueryKey,
  getGetSkillGapsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Target, Award, ArrowRight, TrendingUp } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-primary";
  return "text-destructive";
}

function StatusBadge({ status }: { status: string }) {
  if (status === "done") return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Analyzed</Badge>;
  if (status === "analyzing" || status === "pending") return <Badge variant="secondary" className="animate-pulse bg-yellow-500/10 text-yellow-500 text-xs">Analyzing…</Badge>;
  if (status === "failed") return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  return null;
}

export default function Dashboard() {
  const { user } = useUser();
  const userId = user?.id;

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(
    { userId: userId! },
    {
      query: {
        enabled: !!userId,
        queryKey: getGetDashboardStatsQueryKey({ userId: userId! }),
        staleTime: 0,
        refetchOnMount: true,
      }
    }
  );

  const { data: skillGaps, isLoading: gapsLoading } = useGetSkillGaps(
    { userId: userId! },
    {
      query: {
        enabled: !!userId,
        queryKey: getGetSkillGapsQueryKey({ userId: userId! }),
        staleTime: 0,
        refetchOnMount: true,
      }
    }
  );

  if (!userId) return null;

  const analyzedCount = stats?.analyzedCount ?? 0;
  const totalCount = stats?.totalResumes ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.firstName || user?.username || "there"}</span>. Here's your Skillzy overview.
          </p>
        </div>
        <Link href="/upload">
          <Button className="gap-2 shrink-0 skillzy-gradient border-0 text-white hover:opacity-90 shadow-md shadow-primary/20">
            <UploadCloud className="w-4 h-4" />
            Analyze New Resume
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 skillzy-gradient" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Uploaded</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className="text-3xl font-bold font-mono">{totalCount}</div>
                <p className="text-xs text-muted-foreground mt-1">{analyzedCount} fully analyzed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 skillzy-gradient" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg ATS Score</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className={`text-3xl font-bold font-mono ${scoreColor(stats?.averageAtsScore)}`}>
                  {stats?.averageAtsScore != null ? Math.round(stats.averageAtsScore) : "--"}
                  <span className="text-lg text-muted-foreground font-normal">/100</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">across analyzed resumes</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 skillzy-gradient" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Score</CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <div className={`text-3xl font-bold font-mono ${scoreColor(stats?.bestScore)}`}>
                  {stats?.bestScore ?? "--"}
                  {stats?.bestScore != null && <span className="text-lg text-muted-foreground font-normal">/100</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">personal best</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Recent Resumes
                  </CardTitle>
                  <CardDescription className="mt-1">Your latest uploads and their analysis results.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map(resume => (
                    <Link key={resume.id} href={`/resumes/${resume.id}`}>
                      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 shrink-0">
                            <CircularProgress value={resume.atsScore ?? 0} size={48} strokeWidth={4} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate max-w-[180px] sm:max-w-none">{resume.fileName}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">{format(new Date(resume.uploadedAt), 'MMM d, yyyy')}</span>
                              <StatusBadge status={resume.status} />
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <img src="/logo.png" alt="Skillzy" className="w-16 h-16 object-contain mx-auto mb-4 opacity-20" />
                  <p className="font-semibold text-foreground">No resumes yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Upload your first resume to get started.</p>
                  <Link href="/upload">
                    <Button className="mt-4 gap-2 skillzy-gradient border-0 text-white hover:opacity-90" size="sm">
                      <UploadCloud className="w-4 h-4" />
                      Analyze My Resume
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skill Gaps */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Skill Gaps
              </CardTitle>
              <CardDescription>Common skills missing across your resumes.</CardDescription>
            </CardHeader>
            <CardContent>
              {gapsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
                </div>
              ) : skillGaps && skillGaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillGaps.map((gap, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 font-mono text-xs border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                      {gap.skill}
                      <span className="ml-1.5 text-muted-foreground">×{gap.count}</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Target className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-20" />
                  <p className="text-sm font-medium">No patterns yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Patterns appear after analyzing multiple resumes.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
