"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, Brain, AlertTriangle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Candidate {
  id: string;
  name: string;
  email: string;
  token: string;
  status: string;
  scoreTotal: number | null;
  suspicious: boolean;
  createdAt: string;
  completedAt: string | null;
  link: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  async function loadCandidates() {
    try {
      const data = await api.getCandidates();
      setCandidates(data);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createCandidate(newName, newEmail);
      setNewName("");
      setNewEmail("");
      setOpen(false);
      loadCandidates();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function copyLink(token: string) {
    const link = `${window.location.origin}/eval/${token}`;
    await navigator.clipboard.writeText(link);
  }

  const stats = {
    total: candidates.length,
    completed: candidates.filter((c) => c.status === "COMPLETED").length,
    avgScore: Math.round(
      candidates
        .filter((c) => c.scoreTotal !== null)
        .reduce((sum, c) => sum + (c.scoreTotal || 0), 0) /
        Math.max(candidates.filter((c) => c.scoreTotal !== null).length, 1),
    ),
    suspicious: candidates.filter((c) => c.suspicious).length,
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Candidatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score Promedio</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sospechosos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspicious}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Candidatos</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Nuevo Candidato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Candidato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creando..." : "Crear candidato"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Score</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Link</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Acción</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3 text-sm font-medium">{c.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      c.status === "COMPLETED" ? "success" : c.status === "IN_PROGRESS" ? "warning" : "neutral"
                    }
                  >
                    {c.status === "COMPLETED" ? "Completado" : c.status === "IN_PROGRESS" ? "En curso" : "Pendiente"}
                  </Badge>
                  {c.suspicious && (
                    <Badge variant="destructive" className="ml-1">
                      Sospechoso
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-semibold">
                  {c.scoreTotal !== null ? `${c.scoreTotal}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => copyLink(c.token)}
                    className="text-xs text-accent hover:underline"
                  >
                    Copiar link
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/admin/candidates/${c.id}`)}
                  >
                    Ver detalle
                  </Button>
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay candidatos aún. Crea tu primer candidato para comenzar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
