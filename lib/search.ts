export type SearchResultType =
  | "customer"
  | "invoice"
  | "service"
  | "book"
  | "inventory";

export interface GlobalSearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  meta?: string;
}
