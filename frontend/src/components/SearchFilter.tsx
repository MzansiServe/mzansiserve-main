import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-12 pl-11 text-base border-border bg-card shadow-sm"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          className="h-12 gap-2 px-5"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-border bg-card p-4 shadow-sm animate-fade-in">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {subcategories && selectedCategory !== "all" && subcategories[selectedCategory] && (
            <Select value={selectedSubcategory} onValueChange={onSubcategoryChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Subcategory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subcategories</SelectItem>
                {subcategories[selectedCategory].map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="w-[180px]">
              <MapPin className="mr-1 h-4 w-4" />
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-destructive">
              <X className="mr-1 h-4 w-4" /> Clear All
            </Button>
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
