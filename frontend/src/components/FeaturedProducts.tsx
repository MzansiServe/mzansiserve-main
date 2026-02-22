import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { apiFetch, API_BASE_URL } from "@/lib/api";

interface Product {
    id: string;
    name: string;
    description: string;
    price: string | number;
    image_url: string | null;
    category?: { title: string } | null;
    in_stock: boolean;
}

const FeaturedProducts = () => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch("/api/shop/products?limit=8&in_stock=true")
            .then(res => {
                const items = res?.data?.products || [];
                setProducts(items.slice(0, 8));
            })
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    if (!loading && products.length === 0) return null;

    return (
        <section ref={ref} className="py-24 lg:py-32">
            <div className="container mx-auto px-4 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="mb-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4"
                >
                    <div>
                        <span className="mb-2 inline-block rounded-full bg-sa-red/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sa-red">
                            Shop
                        </span>
                        <h2 className="text-3xl font-bold lg:text-4xl">Featured Products</h2>
                        <p className="mt-2 text-muted-foreground max-w-lg">
                            Discover popular products from verified local sellers across South Africa.
                        </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/shop")} className="shrink-0">
                        View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </motion.div>

                {loading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="rounded-2xl border border-border bg-muted/40 h-64 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {products.map((product, i) => {
                            const imgSrc = product.image_url
                                ? (product.image_url.startsWith("http") ? product.image_url : `${API_BASE_URL}${product.image_url}`)
                                : null;
                            const price = typeof product.price === "string" ? parseFloat(product.price) : product.price;

                            return (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: i * 0.06 }}
                                    className="group cursor-pointer rounded-2xl border border-border/50 bg-card overflow-hidden hover:shadow-lg hover:border-sa-red/30 transition-all duration-300"
                                    onClick={() => navigate(`/shop/product/${product.id}`)}
                                >
                                    <div className="relative h-44 bg-muted/40 overflow-hidden">
                                        {imgSrc ? (
                                            <img
                                                src={imgSrc}
                                                alt={product.name}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                                            </div>
                                        )}
                                        {!product.in_stock && (
                                            <span className="absolute top-2 left-2 rounded-full bg-destructive/90 text-destructive-foreground text-xs px-2 py-0.5">
                                                Out of Stock
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        {product.category?.title && (
                                            <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                {product.category.title}
                                            </p>
                                        )}
                                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-sa-red transition-colors">
                                            {product.name}
                                        </h3>
                                        <p className="mt-1.5 font-bold text-primary">
                                            R{!isNaN(price) ? price.toFixed(2) : "—"}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default FeaturedProducts;
