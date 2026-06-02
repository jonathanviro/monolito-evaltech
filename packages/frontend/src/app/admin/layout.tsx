"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    if (!token && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [router, pathname, isLoginPage]);

  if (!mounted) return null;

  function handleLogout() {
    localStorage.removeItem("token");
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen">
      {!isLoginPage && (
        <header className="sticky top-0 z-10 border-b border-border bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image src="/logo-brilliant.png" alt="Logo" width={34} height={34} className="object-contain" />
              </div>
              <span className="text-sm font-semibold">EvalTech</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Admin</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Salir
              </Button>
            </div>
          </div>
        </header>
      )}
      <main className={`mx-auto px-4 py-8 ${isLoginPage ? "" : "max-w-6xl"}`}>
        {children}
      </main>
    </div>
  );
}
