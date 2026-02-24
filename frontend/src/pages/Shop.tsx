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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

// ─── Product Card (Modern Premium Style) ───────────────────────────────────────
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
  
  // Mock data for design purposes
  const rating = useMemo(() => product.rating || (4 + Math.random()).toFixed(1), [product.rating]);
  const reviews = useMemo(() => product.reviews_count || Math.floor(Math.random() * 50) + 1, [product.reviews_count]);
  const hasPromo = useMemo(() => Math.random() > 0.8, []);

  return (
    <div
      className="group relative flex flex-col bg-white rounded-xl border border-slate-100 hover:border-transparent hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => navigate(`/shop/product/${product.id}`)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {!inStock && (
          <span className="rounded-full bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-sm">
            Out of Stock
          </span>
        )}
        {inStock && hasPromo && (
          <span className="rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 shadow-sm">
            Top Rated
          </span>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/5] bg-slate-50/50 overflow-hidden">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-contain p-6 transition-transform duration-700 ease-out group-hover:scale-110"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              t.style.display = "none";
              (t.nextElementSibling as HTMLElement)?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-300 ${imgSrc ? "hidden" : ""}`}>
          <Package className="h-12 w-12 mb-2" />
          <span className="text-xs font-medium">No image available</span>
        </div>
        
        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
           <Button
            className="w-full bg-white/95 backdrop-blur-sm text-slate-900 hover:bg-primary hover:text-white border-0 shadow-lg font-bold text-xs h-10"
            disabled={!inStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Details Container */}
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-1">
           <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
             {product.category?.title || "General"}
           </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors min-h-[40px]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700 ml-1">{rating}</span>
          </div>
          <span className="text-[11px] text-slate-400">({reviews} reviews)</span>
        </div>

        {/* Price & Action */}
        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="flex flex-col">
              {hasPromo && (
                <span className="text-[10px] text-slate-400 line-through">
                  R {(price * 1.2).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}
                </span>
              )}
              <span className="text-xl font-semibold text-slate-900">
                R {price.toLocaleString("en-ZA")}
              </span>
            </div>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full bg-slate-50 text-slate-600 hover:bg-primary hover:text-white transition-colors md:hidden"
            disabled={!inStock}
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-100 p-0 overflow-hidden animate-pulse flex flex-col h-full">
    <div className="aspect-[4/5] bg-slate-100" />
    <div className="p-5 space-y-4 flex-1">
      <div className="space-y-2">
        <div className="h-2 w-16 rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="h-3 w-24 rounded bg-slate-100" />
      <div className="mt-auto pt-4 flex justify-between items-end">
        <div className="h-6 w-20 rounded bg-slate-100" />
        <div className="h-10 w-10 rounded-full bg-slate-100" />
      </div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, sortBy]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Sync state to URL params gently
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category !== "all") params.set("cat", category);
    if (currentPage > 1) params.set("page", currentPage.toString());
    setSearchParams(params, { replace: true });
  }, [search, category, currentPage, setSearchParams]);

  // Fetch products
  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ["shop-products"],
    queryFn: () => apiFetch("/api/shop/products?limit=200"), // Fetch more to allow client-side pagination
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

  // Paginate
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const handleAddToCart = (product: ApiProduct) => {
    addToCart(product as any);
    toast({
      title: "Added to cart",
      description: `${product.name} was added.`,
    });
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* ── Search & Hero Section ── */}
      <div className="bg-primary pt-24 pb-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-8">
             <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Our Shop</h1>
             <p className="text-white/70 text-sm md:text-base">Find the best products at the best prices</p>
          </div>
          
          <div className="flex gap-3 items-center max-w-4xl mx-auto">
            <div className="relative flex-1 flex shadow-2xl overflow-hidden rounded-xl bg-white p-1">
              <div className="flex items-center pl-3 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <Input
                placeholder="Search for products, brands or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 border-0 focus-visible:ring-0 rounded-none bg-transparent text-slate-800 placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Button className="hidden sm:flex h-12 px-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold ml-1">
                Search
              </Button>
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="lg:hidden flex items-center justify-center w-12 h-12 rounded-xl bg-white text-slate-700 shadow-xl"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Breadcrumb & Toolbar ── */}
      <div className="bg-white border-b sticky top-[64px] z-30 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-slate-500 overflow-hidden whitespace-nowrap">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setCategory("all")}>Home</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-bold text-slate-900 truncate">
              {category === "all" ? "All Products" : categories.find(c => c.id === category)?.title || category}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2">
                <span className="text-[12px] text-slate-400">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-[12px] font-bold text-slate-700 border-none bg-transparent focus:ring-0 cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
             </div>
             <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />
             <div className="text-[12px] text-slate-500">
               <span className="font-bold text-slate-900">{filtered.length}</span> items
             </div>
          </div>
        </div>
      </div>

      {/* ── Layout ── */}
      <div className="container mx-auto px-4 lg:px-8 py-8 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Sidebar ── */}
          <aside className={`shrink-0 w-full lg:w-64 ${showMobileFilters ? "block" : "hidden"} lg:block`}>
            <div className="space-y-8 sticky top-32">
              <div>
                <h3 className="mb-4 text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Categories</h3>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => { setCategory("all"); setShowMobileFilters(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-all ${category === "all"
                          ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                          : "hover:bg-white text-slate-600 hover:text-slate-900"
                        }`}
                    >
                      <span>All Products</span>
                      <ChevronRight className={`h-3 w-3 ${category === "all" ? "opacity-100" : "opacity-0"}`} />
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => { setCategory(cat.id); setShowMobileFilters(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] transition-all ${category === cat.id
                            ? "bg-primary text-white font-bold shadow-lg shadow-primary/20"
                            : "hover:bg-white text-slate-600 hover:text-slate-900"
                          }`}
                      >
                        <span className="truncate pr-2">{cat.title}</span>
                        <span className={`text-[10px] ${category === cat.id ? "text-white/70" : "text-slate-400"} font-normal shrink-0`}>
                          {products.filter(p => (p.category?.id || p.category_id) === cat.id).length}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Promo Banner */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <h4 className="font-bold mb-2 relative z-10">Summer Sale!</h4>
                <p className="text-xs text-white/70 mb-4 relative z-10">Up to 50% off on selected items.</p>
                <Button size="sm" className="w-full bg-white text-slate-900 hover:bg-white/90 font-bold relative z-10">
                  Browse Sale
                </Button>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Loading skeletons */}
            {loadingProducts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Product grid */}
            {!loadingProducts && filtered.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-12">
                  {paginatedItems.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination UI */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12 py-8 border-t border-slate-100">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const page = i + 1;
                          // Show first, last, current, and pages around current
                          if (
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  isActive={currentPage === page}
                                  onClick={() => setCurrentPage(page)}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            page === currentPage - 2 || 
                            page === currentPage + 2
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}

            {/* Empty state */}
            {!loadingProducts && filtered.length === 0 && (
              <div className="bg-white rounded-3xl p-16 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <Search className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No results found</h3>
                <p className="text-slate-500 max-w-sm mb-8">
                  We couldn't find any products matching your search criteria. Try adjusting your filters or search terms.
                </p>
                <Button
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-full h-12 font-bold transition-all hover:px-10"
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
