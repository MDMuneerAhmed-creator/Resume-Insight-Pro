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
import { UploadCloud, FileText, Target, Award, ArrowRight } from "lucide-react";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user } = useUser();
  const userId = user?.id;

  const { data: stats, isLoading: statsLoading } = useGetDashboardStats(
    { userId: userId! },
    { query: { enabled: !!userId, queryKey: getGetDashboardStatsQueryKey({ userId: userId! }) } }
  );

  const { data: skillGaps, isLoading: gapsLoading } = useGetSkillGaps(
    { userId: userId! },
    { query: { enabled: !!userId, queryKey: getGetSkillGapsQueryKey({ userId: userId! }) } }
  );

  if (!userId) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName || 'User'}. Here's your resume overview.</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <UploadCloud className="w-4 h-4" />
            Analyze New Resume
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyzed</CardTitle>
            <FileText className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono">{stats?.totalResumes || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average ATS Score</CardTitle>
            <Target className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono text-primary">
                {stats?.averageAtsScore ? Math.round(stats.averageAtsScore) : '--'}<span className="text-lg text-muted-foreground">/100</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Score</CardTitle>
            <Award className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold font-mono text-primary">
                {stats?.bestScore || '--'}<span className="text-lg text-muted-foreground">/100</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest uploaded resumes and their scores.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map(resume => (
                    <div key={resume.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0">
                          <CircularProgress value={resume.atsScore || 0} size={48} strokeWidth={4} />
                        </div>
                        <div>
                          <p className="font-semibold">{resume.fileName}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{format(new Date(resume.uploadedAt), 'MMM d, yyyy')}</span>
                            <span>&bull;</span>
                            <span className="capitalize">{resume.status}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/resumes/${resume.id}`}>
                        <Button variant="ghost" size="icon">
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>No resumes analyzed yet.</p>
                  <Link href="/upload">
                    <Button variant="link" className="mt-2 text-primary">Upload your first resume</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Frequent Skill Gaps</CardTitle>
              <CardDescription>Skills commonly missing across your uploads.</CardDescription>
            </CardHeader>
            <CardContent>
              {gapsLoading ? (
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-6 w-20 rounded-full" />)}
                </div>
              ) : skillGaps && skillGaps.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skillGaps.map((gap, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 font-mono text-sm border-primary/20 bg-primary/5">
                      {gap.skill}
                      <span className="ml-2 text-muted-foreground">({gap.count})</span>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Target className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>Upload resumes to detect patterns.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
