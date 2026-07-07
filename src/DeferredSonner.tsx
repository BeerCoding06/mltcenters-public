import { lazy, Suspense, useEffect, useState } from "react";

const SonnerToaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
);

export function DeferredSonner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = () => setReady(true);
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 1);
    }
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <SonnerToaster />
    </Suspense>
  );
}
