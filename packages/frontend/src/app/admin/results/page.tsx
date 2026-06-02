"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Candidate {
  id: string;
  name: string;
  scoreTotal: number | null;
  suspicious: boolean;
  status: string;
}

const categoryLabels: Record<string, string> = {
  REACT: "React",
  TYPESCRIPT: "TypeScript",
  REST_API: "REST API",
  GIT: "Git",
  DOCKER: "Docker",
  SQL: "SQL",
  AI: "AI / Vibe Coding",
};

export default function ResultsPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/");

    api.getCandidates().then((data) => {
      setCandidates(data);
    }).catch(() => router.push("/")).finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Cargando...</div>;
  }

  const completed = candidates.filter((c) => c.status === "COMPLETED" && c.scoreTotal !== null);
  const chartData = completed
    .sort((a, b) => (b.scoreTotal || 0) - (a.scoreTotal || 0))
    .map((c) => ({ name: c.name, score: c.scoreTotal || 0, suspicious: c.suspicious }));

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver al Dashboard
      </Button>

      <h1 className="text-2xl font-bold">Resultados Globales</h1>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Comparativa de Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#171717" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {completed.map((c) => (
          <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/admin/candidates/${c.id}`)}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  Score: {c.scoreTotal}%
                  {c.suspicious && (
                    <Badge variant="destructive" className="ml-2">Sospechoso</Badge>
                  )}
                </p>
              </div>
              <div className="w-32">
                <Progress value={c.scoreTotal || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
        {completed.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay resultados.</p>
        )}
      </div>
    </div>
  );
}
