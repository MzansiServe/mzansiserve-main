import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Star, Tag, Loader2, Search, SlidersHorizontal,
  X, ChevronRight, Package, ShoppingBag, Filter, ArrowUpDown,
  BadgeCheck, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";

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

interface ApiCategory {
  id: string;
  title: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const getImageSrc = (product: ApiProduct): string | null => {
  const first = product.images?.[0]?.image_url || product.image_url;
  if (!first) return null;
  if (first.startsWith("http")) return first;
  return `${API_BASE_URL}${first}`;
};

const getPrice = (p: ApiProduct): number => {
  const v = typeof p.price === "string" ? parseFloat(p.price) : p.price;
  return isNaN(v) ? 0 : v;
};

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "name", label: "Title: A to Z" },
];

// ─── Product Card (Takealot Style) ─────────────────────────────────────────────
const ProductCard = ({
  product,
  onAddToCart,
}: {
  product: ApiProduct;
  onAddToCart: (p: ApiProduct) => void;
}) => {
  const navigate = useNavigate();
  const imgSrc = getImageSrc(product);
  const price = getPrice(product);
  const inStock = product.in_stock !== false;
  // Mock rating if missing
  const rating = product.rating || (4 + Math.random()).toFixed(1);
  const reviews = product.reviews_count || Math.floor(Math.random() * 50) + 1;

  return (
    <div
      className="group relative flex flex-col bg-white border border-border/50 hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-shadow duration-200"
      onClick={() => navigate(`/shop/product/${product.id}`)}
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {!inStock && (
          <span className="rounded bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5">
            Out of Stock
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative w-full pt-[100%] bg-white cursor-pointer overflow-hidden p-4">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              t.style.display = "none";
              (t.nextElementSibling as HTMLElement)?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-300 ${imgSrc ? "hidden" : ""}`}>
          <Package className="h-12 w-12 mb-1" />
          <span className="text-xs">No image</span>
        </div>
      </div>

      {/* Details Container */}
      <div className="flex flex-col flex-1 p-4 border-t border-border/30">

        {/* Title */}
        <h3
          className="text-[13px] leading-tight text-slate-700 font-medium line-clamp-2 cursor-pointer hover:text-blue-600 mb-1.5"
          onClick={(e) => { e.stopPropagation(); navigate(`/shop/product/${product.id}`); }}
        >
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={`h-3 w-3 ${i <= Math.round(Number(rating)) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
            ))}
          </div>
          <span className="text-[11px] text-slate-500">({reviews})</span>
        </div>

        {/* Price & Stock */}
        <div className="mt-auto pt-2">
          <div className="text-[22px] font-bold text-slate-900 leading-none mb-1">
            R {price.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <Check className="h-3 w-3" /> In Stock
          </p>
        </div>

        {/* Action Button */}
        <div className="mt-3">
          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-9 text-xs shadow-none border-b-2 border-emerald-700 active:border-b-0 active:translate-y-[2px] transition-all"
            disabled={!inStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
            Add to Cart
          </Button>
        </div>

      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-border/50 animate-pulse flex flex-col h-[380px]">
    <div className="w-full pt-[100%] bg-slate-100" />
    <div className="p-4 space-y-3 flex-1">
      <div className="h-3 w-3/4 rounded bg-slate-200" />
      <div className="h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-4 h-6 w-24 rounded bg-slate-200" />
      <div className="mt-auto h-9 w-full rounded bg-slate-200" />
    </div>
  </div>
);

// ─── Main Shop Page ────────────────────────────────────────────────────────────
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("cat") || "all");
  const [sortBy, setSortBy] = useState("featured");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Sync state to URL params gently
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category !== "all") params.set("cat", category);
    setSearchParams(params, { replace: true });
  }, [search, category, setSearchParams]);

  // Fetch products
  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ["shop-products"],
    queryFn: () => apiFetch("/api/shop/products"),
  });

  // Fetch categories
  const { data: categoriesRes } = useQuery({
    queryKey: ["shop-categories"],
    queryFn: () => apiFetch("/api/shop/categories"),
  });

  const products: ApiProduct[] = productsRes?.data?.products || [];
  const categories: ApiCategory[] = categoriesRes?.data?.categories || [];

  // Filter + sort
  const filtered = useMemo(() => {
    let result = products.filter((p) => {
      if (!p.is_active && p.is_active !== undefined) return false;
      if (category !== "all") {
        const catId = p.category?.id || p.category_id;
        if (catId !== category) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.seller_name || "").toLowerCase().includes(q) ||
          (p.category?.title || "").toLowerCase().includes(q)
        );
      }
      return true;
    });

    switch (sortBy) {
      case "price-low": result = [...result].sort((a, b) => getPrice(a) - getPrice(b)); break;
      case "price-high": result = [...result].sort((a, b) => getPrice(b) - getPrice(a)); break;
      case "name": result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [search, category, sortBy, products]);

  const handleAddToCart = (product: ApiProduct) => {
    addToCart(product as any);
    toast({
      title: "Added to cart",
      description: `${product.name} was added.`,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* ── Search Bar Section ── */}
      <div className="bg-primary pb-4 pt-20 border-b shadow-sm relative z-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex gap-3 items-center max-w-4xl mx-auto">
            <div className="relative flex-1 flex shadow-md overflow-hidden rounded-md bg-white">
              <Input
                placeholder="Search for products, brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 pl-4 pr-10 text-sm border-0 focus-visible:ring-0 rounded-none bg-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="bg-slate-800 text-white w-14 flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-700 transition-colors">
                <Search className="h-5 w-5" />
              </div>
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-md bg-white text-slate-700 shadow-md"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb / Header ── */}
      <div className="bg-white border-b py-2 text-[11px] text-slate-500 shadow-sm relative z-10">
        <div className="container mx-auto px-4 lg:px-8 flex items-center gap-1.5">
          <span className="cursor-pointer hover:underline hover:text-blue-600" onClick={() => setCategory("all")}>Home</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-800">
            {category === "all" ? "All Departments" : categories.find(c => c.id === category)?.title || category}
          </span>
        </div>
      </div>

      {/* ── Layout: Sidebar + Grid ── */}
      <div className="container mx-auto px-4 lg:px-8 py-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar: Categories ── */}
          <aside className={`shrink-0 w-full lg:w-60 ${showMobileFilters ? "block" : "hidden"} lg:block`}>
            <div className="bg-white border border-border/60 rounded p-4 sticky top-24 shadow-sm">
              <h3 className="mb-3 text-[13px] font-bold text-slate-800 uppercase tracking-wide border-b pb-2">Categories</h3>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => { setCategory("all"); setShowMobileFilters(false); }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] transition-colors text-left ${category === "all"
                        ? "bg-slate-100 text-slate-900 font-semibold"
                        : "hover:bg-slate-50 text-slate-600 hover:text-blue-600"
                      }`}
                  >
                    <span>All Products</span>
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setCategory(cat.id); setShowMobileFilters(false); }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-[13px] transition-colors text-left ${category === cat.id
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "hover:bg-slate-50 text-slate-600 hover:text-blue-600"
                        }`}
                    >
                      <span className="truncate pr-2">{cat.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal shrink-0">
                        {products.filter(p => (p.category?.id || p.category_id) === cat.id).length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Header / Sort Toolbar */}
            <div className="bg-white border border-border/60 rounded p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="text-[13px] text-slate-600">
                {loadingProducts ? (
                  "Loading products..."
                ) : (
                  <>
                    <span className="font-bold text-slate-900">{filtered.length}</span> results found
                    {search && <span> for <span className="font-bold italic">"{search}"</span></span>}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[12px] text-slate-500 whitespace-nowrap hidden sm:inline">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 text-[12px] border-slate-200 rounded px-2 w-full sm:w-48 bg-slate-50 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Loading skeletons */}
            {loadingProducts && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[2px] bg-border border border-border">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Product grid container - styled as a tight grid with borders forming between cards */}
            {!loadingProducts && filtered.length > 0 && (
              <div className="bg-white border border-border/60 rounded overflow-hidden shadow-sm">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[1px] bg-border/40">
                  {filtered.map((product, i) => (
                    // Wrap card in a div with white bg so borders show beautifully via the gap
                    <div key={product.id} className="bg-white">
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loadingProducts && filtered.length === 0 && (
              <div className="bg-white border border-border/60 rounded p-12 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="mb-4 text-slate-300">
                  <Search className="h-16 w-16" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">We couldn't find what you're looking for</h3>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                  Check your spelling or try different keywords. Or, browse through our categories on the left.
                </p>
                <Button
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => { setSearch(""); setCategory("all"); }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default Shop;
