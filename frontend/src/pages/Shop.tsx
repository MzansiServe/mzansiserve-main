import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Star, Tag, Loader2, Search, SlidersHorizontal,
  X, ChevronRight, Package, ShoppingBag, Filter, ArrowUpDown,
  BadgeCheck, Check, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_BASE_URL } from "@/lib/api";
import { AdBanner } from "@/components/AdBanner";
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
  product_type?: 'simple' | 'variable' | 'grouped' | 'external';
  attributes?: any;
  variations?: any;
  grouped_products?: any;
  external_url?: string;
  button_text?: string;
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

// ─── Product Card (Airbnb-Inspired Aesthetic) ──────────────────────────────────
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

  const rating = useMemo(() => product.rating || (4.5 + Math.random() * 0.5).toFixed(1), [product.rating]);
  const reviews = useMemo(() => product.reviews_count || Math.floor(Math.random() * 80) + 12, [product.reviews_count]);
  const hasPromo = useMemo(() => Math.random() > 0.85, []);

  return (
    <div
      className="group cursor-pointer flex flex-col"
      onClick={() => navigate(`/shop/product/${product.id}`)}
    >
      {/* Image Gallery Mockup */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-slate-100 mb-3">
        {/* Badges */}
        <div className="absolute top-3 left-3 z-10">
          {!inStock && (
            <span className="bg-white/90 backdrop-blur-md text-[#222222] text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
              Sold out
            </span>
          )}
          {inStock && hasPromo && (
            <span className="bg-primary text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
              Limited offer
            </span>
          )}
        </div>

        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              t.style.display = "none";
              (t.nextElementSibling as HTMLElement)?.classList.remove("hidden");
            }}
          />
        ) : null}

        <div className={`absolute inset-0 flex flex-col items-center justify-center text-slate-300 ${imgSrc ? "hidden" : ""}`}>
          <Package className="h-10 w-10 opacity-20" />
        </div>

        {/* Favorite Button Overlay */}
        <button
          className="absolute top-3 right-3 p-2 text-white/70 hover:text-rose-500 transition-colors z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart className="w-6 h-6 stroke-[2px]" />
        </button>

        {/* Quick Add Overlay */}
        <div className="absolute inset-x-0 bottom-4 px-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            className="w-full bg-white/95 backdrop-blur-md text-[#222222] hover:bg-white border-0 shadow-xl font-bold text-sm h-11 rounded-xl"
            disabled={!inStock && product.product_type !== 'external'}
            onClick={(e) => {
              e.stopPropagation();
              if (product.product_type === 'external') {
                if (product.external_url) { window.open(product.external_url, "_blank"); }
              } else if (product.product_type === 'variable' || product.product_type === 'grouped') {
                navigate(`/shop/product/${product.id}`);
              } else {
                onAddToCart(product);
              }
            }}
          >
            {product.product_type === 'external' ? (product.button_text || "Buy Now") :
              (product.product_type === 'variable' || product.product_type === 'grouped') ? "View Options" :
                (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to cart
                  </>
                )}
          </Button>
        </div>
      </div>

      {/* Details Section */}
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-[15px] font-semibold text-[#222222] line-clamp-1 flex-1 leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
            <span className="text-sm font-normal text-[#222222]">{rating}</span>
          </div>
        </div>

        <p className="text-[15px] text-[#717171] leading-tight font-normal">
          {product.category?.title || "General items"}
        </p>

        <p className="text-[15px] text-[#717171] leading-tight font-normal line-clamp-1">
          Available now
        </p>

        <div className="pt-1 flex items-baseline gap-1.5">
          <span className="text-[15px] font-semibold text-[#222222]">
            R {price.toLocaleString("en-ZA")}
          </span>
          {hasPromo && (
            <span className="text-sm text-[#717171] line-through font-normal">
              R {(price * 1.25).toLocaleString("en-ZA", { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col space-y-3 animate-pulse">
    <div className="aspect-square bg-slate-100 rounded-2xl w-full" />
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div className="h-4 w-2/3 bg-slate-100 rounded-lg" />
        <div className="h-4 w-10 bg-slate-100 rounded-lg" />
      </div>
      <div className="h-3.5 w-1/3 bg-slate-100 rounded-lg" />
      <div className="h-3.5 w-1/4 bg-slate-100 rounded-lg" />
      <div className="h-4 w-20 bg-slate-100 rounded-lg mt-1" />
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
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── Page header ── */}
      <section className="pt-32 pb-12 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23E5E7EB\' fill-opacity=\'0.5\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <span className="inline-block mb-3 text-xs font-medium uppercase tracking-[0.15em] text-primary">Marketplace</span>
              <h1 className="text-4xl md:text-5xl font-semibold text-[#222222] mb-4 tracking-tight">
                Our <span className="text-primary">Shop</span>
              </h1>
              <p className="text-slate-500 font-normal text-base">Find the best products at the best prices</p>
            </motion.div>

            <div className="flex gap-3 items-center max-w-3xl mx-auto">
              <div className="relative flex-1 flex shadow-[0_8px_30px_rgb(0,0,0,0.08)] overflow-hidden rounded-full bg-white border border-slate-200 p-1.5">
                <div className="flex items-center pl-4 text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
                <Input
                  placeholder="Search for products, brands or categories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 border-0 focus-visible:ring-0 rounded-none bg-transparent text-slate-800 placeholder:text-slate-400 font-normal"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="px-3 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
                <Button className="hidden sm:flex h-12 px-8 rounded-full bg-[#222222] hover:bg-[#333] text-white font-medium ml-1">
                  Search
                </Button>
              </div>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden flex items-center justify-center w-12 h-12 rounded-full bg-white border border-slate-200 text-slate-700 shadow-sm"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Breadcrumb & Toolbar ── */}
      <div className="bg-white border-b border-slate-100 sticky top-[64px] z-30">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => setCategory("all")}>Shop</span>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="font-medium text-[#222222] truncate">
              {category === "all" ? "All Products" : categories.find(c => c.id === category)?.title || category}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <span className="text-[12px] text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-[12px] font-medium text-slate-700 border-none bg-transparent focus:ring-0 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="h-4 w-px bg-slate-200 hidden md:block" />
            <div className="text-[12px] text-slate-500">
              <span className="font-medium text-[#222222]">{filtered.length}</span> items
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

              {/* Promo Banner - light style */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/5 rounded-2xl p-6 border border-primary/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'6\' height=\'6\' viewBox=\'0 0 6 6\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%2314B8A6\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M5 0h1L0 6V5zM6 5v1H5z\'/%3E%3C/g%3E%3C/svg%3E')]" />
                <h4 className="font-semibold text-[#222222] mb-2 relative z-10">Summer Sale!</h4>
                <p className="text-xs text-slate-500 mb-4 font-normal relative z-10">Up to 50% off on selected items.</p>
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-xl relative z-10 shadow-md shadow-primary/20">
                  Browse Sale
                </Button>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            <AdBanner placementSection="shop_directory" className="aspect-[4/1] w-full mb-8" />

            {/* Loading skeletons */}
            {loadingProducts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Product grid */}
            {!loadingProducts && filtered.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-10 mb-12">
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
