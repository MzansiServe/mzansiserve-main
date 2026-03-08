import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PrivateRouteProps {
    children: React.ReactNode;
    /** Optional: restrict to specific roles. If omitted, any authenticated user is allowed. */
    roles?: string[];
}

/**
 * Wraps a route so that:
 *  - Unauthenticated visitors are redirected to /login (with `?from=<current path>` so
 *    the login page can redirect back after a successful sign-in).
 *  - If a `roles` array is provided, users whose role is NOT in the list are redirected
 *    to / (or their natural dashboard).
 *  - While the auth state is still loading a full-screen spinner is shown instead of
 *    flashing the protected page.
 */
const PrivateRoute = ({ children, roles }: PrivateRouteProps) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();

    /* ── Still determining auth state ─────────────────────────── */
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    /* ── Not logged in ─────────────────────────────────────────── */
    if (!isAuthenticated) {
        return (
            <Navigate
                to={`/login?from=${encodeURIComponent(location.pathname)}`}
                replace
            />
        );
    }

    /* ── Wrong role ────────────────────────────────────────────── */
    if (roles && user?.role && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default PrivateRoute;
