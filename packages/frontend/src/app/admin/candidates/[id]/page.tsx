"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface Answer {
  id: string;
  selectedAnswer: string | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  question: {
    id: string;
    title: string;
    category: string;
    type: string;
    options: any;
    correctAnswer: string;
    snippet: string | null;
    points: number;
    order: number;
  };
}

interface FocusEvent {
  id: string;
  lostAt: string;
  returnedAt: string | null;
  durationMs: number | null;
}

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  token: string;
  status: string;
  scoreTotal: number | null;
  suspicious: boolean;
  createdAt: string;
  completedAt: string | null;
  evaluation: { categoryScores: Record<string, number> } | null;
  answers: Answer[];
  totalQuestions: number;
  focusLossCount: number;
  totalFocusLossMs: number;
  focusEvents: FocusEvent[];
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

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/");

    api.getCandidate(params.id as string).then(setCandidate).catch(() => router.push("/admin")).finally(() => setLoading(false));
  }, [params.id, router]);

  async function handleGrade(answerId: string, isCorrect: boolean) {
    if (!candidate) return;
    setGrading(answerId);
    try {
      await api.scoreOpenQuestion(candidate.id, answerId, isCorrect);
      const updated = await api.getCandidate(candidate.id);
      setCandidate(updated);
    } catch (err) {
      alert("Error al calificar");
    } finally {
      setGrading(null);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!candidate) return null;

  const radarData = candidate.evaluation?.categoryScores
    ? Object.entries(candidate.evaluation.categoryScores).map(([key, value]) => ({
        category: categoryLabels[key] || key,
        score: value,
      }))
    : [];

  const openAnswers = candidate.answers.filter((a) => a.question.type === "OPEN");

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{candidate.name}</h1>
          <p className="text-sm text-muted-foreground">{candidate.email}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {candidate.scoreTotal !== null ? `${candidate.scoreTotal}%` : "—"}
          </div>
          <p className="text-xs text-muted-foreground">Score total</p>
          {candidate.suspicious && (
            <Badge variant="destructive" className="mt-1">
              Sospechoso
            </Badge>
          )}
        </div>
      </div>

      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Score por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e5e5" />
                    <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: "#737373" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    <Radar
                      dataKey="score"
                      stroke="#171717"
                      fill="#171717"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {radarData.map((d) => (
                  <div key={d.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span>{d.category}</span>
                      <span className="font-semibold">{d.score}%</span>
                    </div>
                    <Progress value={d.score} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Eventos de Foco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{candidate.focusLossCount}</p>
              <p className="text-xs text-muted-foreground">Veces que perdió el foco</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold">{Math.round(candidate.totalFocusLossMs / 1000)}s</p>
              <p className="text-xs text-muted-foreground">Tiempo total fuera</p>
            </div>
          </div>
          {candidate.focusLossCount > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Últimos eventos:</p>
              {candidate.focusEvents.slice(0, 5).map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-1.5 text-xs">
                  <span>{new Date(e.lostAt).toLocaleString()}</span>
                  <span className="text-muted-foreground">{e.durationMs ? `${Math.round(e.durationMs / 1000)}s` : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Respuestas ({candidate.answers.length}/{candidate.totalQuestions})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.answers.map((answer) => {
            const q = answer.question;
            const isMultipleChoice = q.type === "MULTIPLE_CHOICE" || q.type === "DEBUGGING";
            const isCorrect = isMultipleChoice
              ? answer.selectedAnswer === q.correctAnswer
              : answer.isCorrect;

            return (
              <div key={answer.id} className="rounded-lg border border-border p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" className="text-xs">
                        {categoryLabels[q.category] || q.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {q.type === "OPEN" ? "Abierta" : q.type === "DEBUGGING" ? "Debugging" : "Múltiple"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium">{q.title}</p>
                  </div>
                  {isMultipleChoice && (
                    isCorrect ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                    )
                  )}
                </div>

                {q.snippet && (
                  <pre className="mb-2 overflow-x-auto rounded-md bg-secondary p-3 text-xs">{q.snippet}</pre>
                )}

                {isMultipleChoice && (
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Respuesta:</span> {answer.selectedAnswer || "—"}</p>
                    <p><span className="text-muted-foreground">Correcta:</span> {q.correctAnswer}</p>
                  </div>
                )}

                {q.type === "OPEN" && (
                  <div className="space-y-2">
                    <p className="text-sm">{answer.textAnswer || "Sin respuesta"}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={answer.isCorrect === true ? "default" : "outline"}
                        onClick={() => handleGrade(answer.id, true)}
                        disabled={grading === answer.id}
                      >
                        ✅ Correcta
                      </Button>
                      <Button
                        size="sm"
                        variant={answer.isCorrect === false ? "destructive" : "outline"}
                        onClick={() => handleGrade(answer.id, false)}
                        disabled={grading === answer.id}
                      >
                        ❌ Incorrecta
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {candidate.answers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Este candidato aún no ha respondido ninguna pregunta.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
