"use client";

import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

type Question = {
  id: string;
  title: string;
  description: string | null;
  snippet: string | null;
  category: string;
  type: "MULTIPLE_CHOICE" | "DEBUGGING" | "OPEN";
  options: { id: string; text: string }[] | null;
  correctAnswer: string;
  points: number;
  order: number;
};

type Answer = {
  questionId: string;
  selectedAnswer?: string;
  textAnswer?: string;
};

const categoryLabels: Record<string, string> = {
  REACT: "React",
  TYPESCRIPT: "TypeScript",
  REST_API: "REST API",
  GIT: "Git",
  DOCKER: "Docker",
  SQL: "SQL",
  AI: "AI / Vibe Coding",
};

const TOTAL_TIME = 45 * 60; // 45 minutes in seconds

export default function EvaluationPage() {
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState<"loading" | "instructions" | "questions" | "done">("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ scoreTotal: number; suspicious: boolean } | null>(null);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [candidateName, setCandidateName] = useState("");
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const focusLostRef = useRef<number | null>(null);

  useEffect(() => {
    api.getEvaluation(token)
      .then((data) => {
        setCandidateName(data.name);
        if (data.status === "COMPLETED") {
          setStep("done");
        } else {
          // Calculate remaining time from startedAt
          if (data.startedAt) {
            const started = new Date(data.startedAt).getTime();
            const elapsed = Math.floor((Date.now() - started) / 1000);
            const remaining = Math.max(0, TOTAL_TIME - elapsed);
            setTimeLeft(remaining);
          }
          setStep("instructions");
        }
      })
      .catch(() => setError("Link de evaluación inválido o expirado."));
  }, [token]);

  async function handleStart() {
    try {
      const data = await api.startEvaluation(token);
      setQuestions(data.questions);
      const answerMap: Record<string, Answer> = {};
      for (const a of data.answers) {
        answerMap[a.questionId] = {
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer || undefined,
          textAnswer: a.textAnswer || undefined,
        };
      }
      setAnswers(answerMap);
      // Resume from first unanswered question
      const firstUnanswered = data.questions.findIndex(
        (q: Question) => !answerMap[q.id]?.selectedAnswer && !answerMap[q.id]?.textAnswer
      );
      setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      // Set timer from backend if resuming
      if (data.startedAt) {
        const started = new Date(data.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - started) / 1000);
        const remaining = Math.max(0, TOTAL_TIME - elapsed);
        setTimeLeft(remaining);
      }
      setStep("questions");
      startTimer();
    } catch {
      setError("Error al iniciar la evaluación.");
    }
  }

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Track focus loss
  useEffect(() => {
    if (step !== "questions") return;

    function handleBlur() {
      if (!focusLostRef.current) focusLostRef.current = Date.now();
    }

    function handleFocus() {
      const lostAt = focusLostRef.current;
      if (!lostAt) return;
      const now = Date.now();
      api.reportFocusLoss(token, new Date(lostAt).toISOString(), new Date(now).toISOString(), now - lostAt)
        .catch(() => {});
      focusLostRef.current = null;
      setShowFocusWarning(true);
      setTimeout(() => setShowFocusWarning(false), 4000);
    }

    function handleVisibility() {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    }

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [step, token]);

  // Block copy/paste/right-click
  useEffect(() => {
    if (step !== "questions") return;
    function prevent(e: Event) { e.preventDefault(); }
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
    };
  }, [step]);

  // Auto-save on answer change
  useEffect(() => {
    if (step !== "questions") return;
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;
    const answer = answers[currentQuestion.id];
    if (!answer) return;

    const timeout = setTimeout(() => {
      api.submitAnswer(token, currentQuestion.id, answer.selectedAnswer, answer.textAnswer)
        .catch(() => {});
    }, 800);

    return () => clearTimeout(timeout);
  }, [answers, currentIndex, questions, token, step]);

  function handleSelectAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, selectedAnswer: value },
    }));
  }

  function handleTextAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], questionId, textAnswer: value },
    }));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Save current question first
    const currentQ = questions[currentIndex];
    const currentA = answers[currentQ?.id];
    if (currentA?.selectedAnswer || currentA?.textAnswer) {
      await api.submitAnswer(token, currentQ.id, currentA.selectedAnswer, currentA.textAnswer);
    }

    // Save remaining answers
    for (const q of questions) {
      const answer = answers[q.id];
      if (q.id === currentQ?.id) continue;
      if (answer?.selectedAnswer || answer?.textAnswer) {
        await api.submitAnswer(token, q.id, answer.selectedAnswer, answer.textAnswer)
          .catch(() => {});
      }
    }

    try {
      const res = await api.submitEvaluation(token);
      setResult(res);
      setStep("done");
    } catch {
      setError("Error al enviar la evaluación.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Cargando...
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <div className="mx-auto mb-4 flex w-60 items-center justify-center">
              <Image src="/logo-brilliant.png" alt="Logo" width={200} height={200} className="object-contain" />
            </div>
            <h2 className="text-xl font-bold">¡Evaluación enviada!</h2>
            <p className="text-sm text-muted-foreground">
              Gracias por completar la evaluación técnica. Tu progreso ha sido registrado exitosamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "instructions") {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex w-60 items-center justify-center">
              <Image src="/logo-brilliant.png" alt="Logo" width={200} height={200} className="object-contain" />
            </div>
            <CardTitle className="text-xl">Evaluación Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 text-sm space-y-2">
              <p><strong>Instrucciones:</strong></p>
              <ul className="list-disc space-y-1 pl-4">
                <li>La evaluación consta de <strong>31 preguntas</strong> divididas en 7 categorías.</li>
                <li>Tienes <strong>45 minutos</strong> para completarla.</li>
                <li>Las respuestas se guardan automáticamente al avanzar a la siguiente pregunta.</li>
                <li>No puedes volver a preguntas anteriores una vez que avances.</li>
                <li>No puedes volver atrás una vez enviada la evaluación.</li>
                <li>No salgas de esta pestaña durante la evaluación. Hacerlo se registra automáticamente.</li>
                <li>Copy/paste y clic derecho están deshabilitados.</li>
              </ul>
            </div>
            <Separator />
            <div className="text-sm space-y-1">
              <p><strong>Candidato:</strong> {candidateName}</p>
            </div>
            <Button onClick={handleStart} className="w-full">
              Comenzar evaluación
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const progress = ((Object.keys(answers).length) / questions.length) * 100;
  const isMultipleChoice = currentQuestion.type === "MULTIPLE_CHOICE" || currentQuestion.type === "DEBUGGING";
  const currentAnswer = answers[currentQuestion.id];
  const isAnswered = isMultipleChoice
    ? !!currentAnswer?.selectedAnswer
    : !!currentAnswer?.textAnswer?.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center">
              <Image src="/logo-brilliant.png" alt="Logo" width={34} height={34} className="object-contain" />
            </div>
            <span className="text-sm font-semibold">Evaluación Técnica</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm font-mono font-semibold ${timeLeft < 300 ? "text-destructive" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      {showFocusWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="mx-4 max-w-sm text-center">
            <CardContent className="py-8 space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">Has salido de la evaluación</p>
              <p className="text-xs text-muted-foreground">Esto ha sido registrado. Salir repetidamente puede marcar tu resultado como sospechoso.</p>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Pregunta {currentIndex + 1} de {questions.length}</span>
            <span>{Object.keys(answers).length} respondidas</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Question Card */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Badge variant="neutral" className="text-xs">
                {categoryLabels[currentQuestion.category] || currentQuestion.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentQuestion.type === "OPEN" ? "Abierta" : currentQuestion.type === "DEBUGGING" ? "Debugging" : "Múltiple opción"}
              </Badge>
              <span className="ml-auto text-xs text-muted-foreground">{currentQuestion.points} pts</span>
            </div>

            <div>
              <h3 className="text-base font-medium">{currentQuestion.title}</h3>
              {currentQuestion.description && (
                <p className="mt-1 text-sm text-muted-foreground">{currentQuestion.description}</p>
              )}
            </div>

            {currentQuestion.snippet && (
              <pre className="overflow-x-auto rounded-md bg-secondary p-4 text-sm">{currentQuestion.snippet}</pre>
            )}

            {isMultipleChoice && currentQuestion.options && (
              <RadioGroup
                value={answers[currentQuestion.id]?.selectedAnswer || ""}
                onValueChange={(v) => handleSelectAnswer(currentQuestion.id, v)}
                className="space-y-2"
              >
                {currentQuestion.options.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-3 rounded-lg border border-border p-3 has-[[data-state=checked]]:border-primary">
                    <RadioGroupItem value={opt.id} id={`${currentQuestion.id}-${opt.id}`} />
                    <Label htmlFor={`${currentQuestion.id}-${opt.id}`} className="flex-1 cursor-pointer text-sm">
                      <span className="font-mono text-xs text-muted-foreground mr-2">{opt.id.toUpperCase()}.</span>
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === "OPEN" && (
              <Textarea
                placeholder="Escribe tu respuesta aquí..."
                value={answers[currentQuestion.id]?.textAnswer || ""}
                onChange={(e) => handleTextAnswer(currentQuestion.id, e.target.value)}
                rows={5}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-end">
          {currentIndex < questions.length - 1 ? (
            <Button
              variant="default"
              size="sm"
              disabled={!isAnswered}
              onClick={async () => {
                const q = questions[currentIndex];
                const a = answers[q.id];
                if (a?.selectedAnswer || a?.textAnswer) {
                  await api.submitAnswer(token, q.id, a.selectedAnswer, a.textAnswer);
                }
                setCurrentIndex((i) => i + 1);
              }}
            >
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button size="default" onClick={handleSubmit} disabled={submitting || !isAnswered}>
              {submitting ? "Enviando..." : "Enviar evaluación"}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
