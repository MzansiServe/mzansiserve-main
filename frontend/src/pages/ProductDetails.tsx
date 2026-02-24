import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Star,
  ChevronLeft,
  ChevronRight,
  Package,
  Check,
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ApiProduct {
  id: string;
  name: string;
  description: string;
  price: string | number;
  image_url: string | null;
  images?: Array<{ image_url: string }>;
  category?: { id: string; title: string } | null;
  category_id?: string | null;
  in_stock?: boolean;
  is_active?: boolean;
  seller_name?: string;
  rating?: number;
  reviews_count?: number;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch product details
  const { data: productRes, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiFetch(`/api/shop/products/${id}`),
    enabled: !!id,
  });

  const product: ApiProduct | null = productRes?.data || null;

  const images = useMemo(() => {
    if (!product) return [];
    const imgs = product.images?.map((img) => img.image_url) || [];
    if (product.image_url && !imgs.includes(product.image_url)) {
      imgs.unshift(product.image_url);
    }
    return imgs.length > 0 ? imgs : [null];
  }, [product]);

  const price = useMemo(() => {
    if (!product) return 0;
    const v = typeof product.price === "string" ? parseFloat(product.price) : product.price;
    return isNaN(v) ? 0 : v;
  }, [product]);

  const getImageSrc = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    return `${API_BASE_URL}${url}`;
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addToCart(product as any);
    }
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium text-sm">Loading product details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <Package className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h1>
          <p className="text-slate-500 max-w-md mb-8">
            The product you're looking for doesn't exist or has been removed from our shop.
          </p>
          <Button onClick={() => navigate("/shop")} className="bg-primary hover:bg-primary/90">
            Back to Shop
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const inStock = product.in_stock !== false;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
            <button onClick={() => navigate("/")} className="hover:text-primary transition-colors">Home</button>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <button onClick={() => navigate("/shop")} className="hover:text-primary transition-colors">Shop</button>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-bold text-slate-900 truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16">
            {/* Image Gallery */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative aspect-square bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 group">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={selectedImageIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                    src={getImageSrc(images[selectedImageIndex]) || "/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-contain p-8 md:p-12"
                  />
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 px-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-24 aspect-square rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        selectedImageIndex === idx ? "border-primary ring-4 ring-primary/10" : "border-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <img
                        src={getImageSrc(img) || "/placeholder.png"}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                    {product.category?.title || "New Arrival"}
                  </span>
                  {inStock ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <Check className="h-3.5 w-3.5" /> In Stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
                      <X className="h-3.5 w-3.5" /> Out of Stock
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 leading-tight mb-4 tracking-tight">
                  {product.name}
                </h1>

                <div className="flex items-center gap-4 mb-8">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= Math.round(product.rating || 4.5) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100"
                        }`}
                      />
                    ))}
                    <span className="text-sm font-bold text-slate-700 ml-1">
                      {product.rating || "4.5"}
                    </span>
                  </div>
                  <div className="w-[1px] h-4 bg-slate-200" />
                  <span className="text-sm text-slate-500 font-medium">
                    {product.reviews_count || 48} Customer reviews
                  </span>
                </div>

                <div className="flex items-baseline gap-4 mb-8">
                  <span className="text-4xl font-black text-slate-900">
                    R {price.toLocaleString("en-ZA")}
                  </span>
                  <span className="text-lg text-slate-400 line-through">
                    R {(price * 1.2).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-600 text-[10px] font-bold">
                    SAVE 20%
                  </span>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 mb-8">
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Description</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {product.description || "No description available for this product yet. Stay tuned for more details about this amazing item."}
                  </p>
                </div>

                {/* Seller Info */}
                <div className="flex items-center gap-3 mb-8 p-4 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Sold by</p>
                    <p className="text-sm font-bold text-slate-900">{product.seller_name || "MzansiServe Marketplace"}</p>
                  </div>
                </div>

                {/* Add to Cart Controls */}
                <div className="flex flex-col gap-4 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border border-slate-200 rounded-xl h-14 px-2">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-bold text-slate-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-primary transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <Button
                      disabled={!inStock}
                      onClick={handleAddToCart}
                      className="flex-1 h-14 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/25 transition-all active:scale-95"
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      Add to Cart
                    </Button>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-8 border-t border-slate-100">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                      <Truck className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">Fast Delivery</p>
                    <p className="text-[9px] text-slate-400">Within 2-3 business days</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">Secure Payment</p>
                    <p className="text-[9px] text-slate-400">100% Secure Checkout</p>
                  </div>
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                      <RotateCcw className="h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-900 uppercase">Easy Returns</p>
                    <p className="text-[9px] text-slate-400">30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
