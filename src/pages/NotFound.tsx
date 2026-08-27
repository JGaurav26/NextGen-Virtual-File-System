import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center grid-bg px-6">
      <div className="text-center rounded-2xl border border-primary/20 bg-card/80 p-10 border-glow">
        <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-accent">I/O error</p>
        <h1 className="mb-3 text-6xl font-semibold text-primary text-glow-green">404</h1>
        <p className="mb-6 text-muted-foreground font-mono text-sm">
          Path not found: <span className="text-warning">{location.pathname}</span>
        </p>
        <Link
          to="/"
          className="inline-flex rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"
        >
          Return to console
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
