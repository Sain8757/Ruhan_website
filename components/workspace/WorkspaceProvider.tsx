"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  Camera,
  ChevronRight,
  Command,
  DatabaseBackup,
  FilePlus2,
  Layers,
  LayoutDashboard,
  Loader2,
  QrCode,
  MessageSquare,
  Package,
  Receipt,
  ScanLine,
  Search,
  Settings,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import type { GlobalSearchResult, SearchResultType } from "@/lib/search";
import {
  matchesCommand,
  QUICK_ACTIONS,
  WORKSPACE_COMMANDS,
  type WorkspaceCommand,
  type WorkspaceIcon,
} from "@/lib/workspace";
import { cn } from "@/lib/utils";

type PaletteMode = "search" | "command";

interface WorkspaceContextValue {
  openSearch: () => void;
  openCommandPalette: () => void;
}

interface PaletteItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: WorkspaceIcon;
  source: "command" | "record";
  badge?: string;
  shortcut?: string;
  recordType?: SearchResultType;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  openSearch: () => {},
  openCommandPalette: () => {},
});

const iconMap = {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  FilePlus2,
  Receipt,
  Camera,
  ScanLine,
  Layers,
  BookOpen,
  Package,
  MessageSquare,
  BarChart3,
  Settings,
  WalletCards,
  Bell,
  DatabaseBackup,
  QrCode,
} satisfies Record<WorkspaceIcon, React.ComponentType<{ size?: number; className?: string }>>;

const recordIconMap = {
  customer: "Users",
  invoice: "Receipt",
  service: "Briefcase",
  book: "BookOpen",
  inventory: "Package",
} satisfies Record<SearchResultType, WorkspaceIcon>;

function commandToItem(command: WorkspaceCommand): PaletteItem {
  return {
    id: command.id,
    title: command.label,
    subtitle: String(command.section),
    href: command.href,
    icon: command.icon,
    source: "command",
    shortcut: command.shortcut,
  };
}

function resultToItem(result: GlobalSearchResult): PaletteItem {
  return {
    id: `${result.type}-${result.id}`,
    title: result.title,
    subtitle: result.subtitle,
    href: result.href,
    icon: recordIconMap[result.type],
    source: "record",
    badge: result.badge,
    recordType: result.type,
  };
}

function shortcutLabel(label: string) {
  return label.replace("Ctrl", "Ctrl/Cmd");
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<PaletteMode | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearSearch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setQuery("");
    setResults([]);
    setLoading(false);
    setActiveIndex(0);
  }, []);

  const focusInput = useCallback(() => {
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, []);

  const openSearch = useCallback(() => {
    clearSearch();
    setMode("search");
    focusInput();
  }, [clearSearch, focusInput]);

  const openCommandPalette = useCallback(() => {
    clearSearch();
    setMode("command");
    focusInput();
  }, [clearSearch, focusInput]);

  const closePalette = useCallback(() => {
    setMode(null);
    clearSearch();
  }, [clearSearch]);

  const runSearch = useCallback((nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=10`, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results: GlobalSearchResult[] };
        setResults(data.results);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        toast.error("Search is temporarily unavailable");
      } finally {
        setLoading(false);
      }
    }, 140);
  }, [toast]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setActiveIndex(0);

    if (mode === "search") {
      runSearch(value);
    }
  };

  const commandItems = useMemo(() => {
    const source = query.trim() ? WORKSPACE_COMMANDS : QUICK_ACTIONS;
    return source.filter((command) => matchesCommand(command, query)).map(commandToItem);
  }, [query]);

  const recordItems = useMemo(() => results.map(resultToItem), [results]);

  const items = useMemo(() => {
    if (mode === "command") return commandItems.slice(0, 12);
    if (!query.trim()) return commandItems.slice(0, 8);
    return [...recordItems, ...commandItems.slice(0, 4)].slice(0, 12);
  }, [commandItems, mode, query, recordItems]);

  const executeItem = useCallback((item: PaletteItem) => {
    if (item.href === "#search") {
      openSearch();
      return;
    }

    router.push(item.href);
    closePalette();
  }, [closePalette, openSearch, router]);

  const navigateTo = useCallback((href: string) => {
    router.push(href);
    setMode(null);
  }, [router]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!event.key) return;
      const key = event.key.toLowerCase();
      const modified = event.ctrlKey || event.metaKey;

      if (!modified) {
        if (event.key === "Escape" && mode) closePalette();
        return;
      }

      if (event.shiftKey && key === "p") {
        event.preventDefault();
        openCommandPalette();
        return;
      }

      const action = QUICK_ACTIONS.find((item) => item.shortcut?.toLowerCase() === `ctrl+${key}`);
      if (action && !event.shiftKey) {
        event.preventDefault();
        navigateTo(action.href);
        return;
      }

      if (key === "f" && !event.shiftKey) {
        event.preventDefault();
        openSearch();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closePalette, mode, navigateTo, openCommandPalette, openSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const contextValue = useMemo(
    () => ({ openSearch, openCommandPalette }),
    [openCommandPalette, openSearch]
  );

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}

      {mode && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => event.target === event.currentTarget && closePalette()}
          style={{ alignItems: "flex-start", paddingTop: "72px" }}
        >
          <div
            className="modal-content overflow-hidden"
            style={{ maxWidth: "680px", borderRadius: "18px" }}
          >
            <div
              className="flex items-center gap-3 border-b px-4 py-3"
              style={{ borderColor: "var(--border-primary)" }}
            >
              {mode === "command" ? (
                <Command size={18} style={{ color: "var(--text-muted)" }} />
              ) : (
                <Search size={18} style={{ color: "var(--text-muted)" }} />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.min(current + 1, Math.max(items.length - 1, 0)));
                  }
                  if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveIndex((current) => Math.max(current - 1, 0));
                  }
                  if (event.key === "Enter" && items[activeIndex]) {
                    event.preventDefault();
                    executeItem(items[activeIndex]);
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closePalette();
                  }
                }}
                placeholder={
                  mode === "command"
                    ? "Run command or open module"
                    : "Search customer, mobile, Aadhaar, PAN, invoice, service, book, product"
                }
                className="min-w-0 flex-1 bg-transparent text-sm outline-none sm:text-base"
                style={{ color: "var(--text-primary)" }}
              />
              {loading && <Loader2 size={16} className="animate-spin" style={{ color: "var(--text-muted)" }} />}
              <button className="btn-ghost p-2" onClick={closePalette} title="Close">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[58vh] overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No results found
                </div>
              ) : (
                items.map((item, index) => {
                  const Icon = iconMap[item.icon];
                  const active = index === activeIndex;

                  return (
                    <button
                      key={`${item.source}-${item.id}`}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
                        active && "shadow-sm"
                      )}
                      style={{
                        background: active ? "var(--bg-tertiary)" : "transparent",
                        color: "var(--text-primary)",
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => executeItem(item)}
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm text-white"
                        style={{
                          background: item.source === "record" 
                            ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" // Blue for records
                            : item.subtitle === "Core" ? "linear-gradient(135deg, #6366f1, #4338ca)" // Indigo
                            : item.subtitle === "Tools" ? "linear-gradient(135deg, #10b981, #047857)" // Emerald
                            : item.subtitle === "Inventory" ? "linear-gradient(135deg, #f59e0b, #b45309)" // Amber
                            : item.subtitle === "Business" ? "linear-gradient(135deg, #8b5cf6, #6d28d9)" // Violet
                            : item.subtitle === "Action" ? "linear-gradient(135deg, #ef4444, #b91c1c)" // Red
                            : "linear-gradient(135deg, #64748b, #334155)", // Slate for automation/other
                        }}
                      >
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                          {item.subtitle}
                        </span>
                      </span>
                      {item.badge && (
                        <span className="badge whitespace-nowrap" style={{ background: "var(--bg-secondary)" }}>
                          {item.badge}
                        </span>
                      )}
                      {item.shortcut && (
                        <kbd
                          className="hidden rounded-md px-2 py-1 text-[11px] font-semibold sm:inline-flex"
                          style={{
                            background: "var(--bg-secondary)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {shortcutLabel(item.shortcut)}
                        </kbd>
                      )}
                      <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
