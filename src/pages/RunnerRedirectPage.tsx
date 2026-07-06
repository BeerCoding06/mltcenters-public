import { useEffect } from 'react';

/** Full-page redirect — runner is a separate app at /runner-app/ */
export default function RunnerRedirectPage() {
  useEffect(() => {
    window.location.replace('/runner-app/');
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
      Loading 3D Runner…
    </div>
  );
}
