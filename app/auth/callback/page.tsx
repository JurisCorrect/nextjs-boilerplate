import React, { Suspense } from "react";
import Client from "./Client";

// ❗ Config de segment : à mettre côté server
export const dynamic = "force-dynamic";
export const revalidate = false;

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <p className="text-sm text-gray-600">Chargement…</p>
        </div>
      }
    >
      <Client />
    </Suspense>
  );
}
