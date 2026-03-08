import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { locations } from "@/lib/mock-data";

interface SearchFilterProps {
  searchPlaceholder?: string;
  categories: readonly string[];
  subcategories?: Record<string, string[]>;
  selectedCategory: string;
  selectedSubcategory: string;
  selectedLocation: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategoryChange: (cat: string) => void;
  onSubcategoryChange: (sub: string) => void;
  onLocationChange: (loc: string) => void;
  onClearFilters: () => void;
  resultCount: number;
}

const SearchFilter = ({
  searchPlaceholder = "Search services...",
  categories,
  subcategories,
  selectedCategory,
  selectedSubcategory,
  selectedLocation,
  searchQuery,
  onSearchChange,
  onCategoryChange,
  onSubcategoryChange,
  onLocationChange,
  onClearFilters,
  resultCount,
}: SearchFilterProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = selectedCategory !== "all" || selectedSubcategory !== "all" || selectedLocation !== "all" || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      {/* Search bar */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-14 pl-12 text-base border-slate-50 bg-white shadow-sm shadow-slate-100 rounded-2xl focus-visible:ring-primary/20 focus-visible:border-primary/20 transition-all"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#222222]">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          className={cn(
            "h-14 gap-2 px-6 rounded-2xl font-bold transition-all",
            showFilters ? "bg-[#222222] text-white" : "border-slate-50 bg-white text-slate-600 hover:bg-slate-50"
          )}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-3xl border border-slate-50 bg-white p-6 shadow-sm shadow-slate-200/50 animate-fade-in">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</span>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[200px] h-11 rounded-xl border-slate-50 bg-slate-50/50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subcategories && selectedCategory !== "all" && subcategories[selectedCategory] && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Subcategory</span>
              <Select value={selectedSubcategory} onValueChange={onSubcategoryChange}>
                <SelectTrigger className="w-[220px] h-11 rounded-xl border-slate-50 bg-slate-50/50">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {subcategories[selectedCategory].map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Location</span>
            <Select value={selectedLocation} onValueChange={onLocationChange}>
              <SelectTrigger className="w-[200px] h-11 rounded-xl border-slate-50 bg-slate-50/50">
                <MapPin className="mr-2 h-4 w-4 text-slate-300" />
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl shadow-2xl border-slate-50">
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-end pb-1 ml-auto">
              <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-sa-red hover:text-sa-red/80 hover:bg-sa-red/5 font-bold">
                <X className="mr-1 h-4 w-4" /> Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Result count */}
      <p className="text-sm text-muted-foreground">
        {resultCount} result{resultCount !== 1 ? "s" : ""} found
        {hasActiveFilters && " (filtered)"}
      </p>
    </div>
  );
};

export default SearchFilter;
