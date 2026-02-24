import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import Transport from "./pages/Transport";
import Professionals from "./pages/Professionals";
import Shop from "./pages/Shop";
import ProductDetails from "./pages/ProductDetails";
import About from "./pages/About";
import BookService from "./pages/BookService";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DriverDashboard from "./pages/dashboards/driver/DriverDashboard";
import ProfessionalDashboard from "./pages/dashboards/professional/ProfessionalDashboard";
import ServiceProviderDashboard from "./pages/dashboards/service-provider/ServiceProviderDashboard";
import AgentDashboard from "./pages/dashboards/agent/AgentDashboard";
import PaymentStatus from "./pages/PaymentStatus";
import PaymentError from "./pages/PaymentError";
import Checkout from "./pages/Checkout";
import ShoppingHistory from "./pages/ShoppingHistory";
import MyBookings from "./pages/MyBookings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/services" element={<Services />} />
              <Route path="/transport" element={<Transport />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/product/:id" element={<ProductDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/book/:category/:id" element={<BookService />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/dashboard/driver" element={<DriverDashboard />} />
              <Route path="/dashboard/professional" element={<ProfessionalDashboard />} />
              <Route path="/dashboard/provider" element={<ServiceProviderDashboard />} />
              <Route path="/dashboard/agent" element={<AgentDashboard />} />
              <Route path="/payment-status" element={<PaymentStatus />} />
              <Route path="/payment-error" element={<PaymentError />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/shopping-history" element={<ShoppingHistory />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
