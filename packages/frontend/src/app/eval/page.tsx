"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function EvalLandingPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return;
    router.push(`/eval/${token.trim()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex w-60 items-center justify-center">
            <Image src="/logo-brilliant.png" alt="Logo" width={200} height={200} className="object-contain" />
          </div>
          <CardTitle className="text-xl">Evaluación Técnica</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStart} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">Ingresa tu token de evaluación</label>
              <Input
                id="token"
                placeholder="Pega tu token aquí"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!token.trim()}>
              Comenzar evaluación
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
