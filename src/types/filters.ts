export interface FilterState {
  minPrice: number;
  maxPrice: number;
  selectedCategories: string[];
  inStockOnly: boolean;
  sort: 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';
}
