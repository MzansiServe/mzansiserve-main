import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      {/* Dot pattern background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23E5E7EB\' fill-opacity=\'0.5\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-60 pointer-events-none" />

      <div className="relative z-10 text-center max-w-md">
        {/* Big 404 */}
        <p className="text-[120px] md:text-[160px] font-semibold text-[#222222] leading-none select-none">
          404
        </p>

        {/* Divider */}
        <div className="w-16 h-1 bg-primary rounded-full mx-auto my-6" />

        <h1 className="text-2xl md:text-3xl font-semibold text-[#222222] mb-3">
          Page not found
        </h1>
        <p className="text-slate-500 font-normal text-base mb-10 leading-relaxed">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-2 border-slate-200 text-slate-600 hover:border-slate-300 font-medium px-8 py-6 rounded-xl transition-all"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
