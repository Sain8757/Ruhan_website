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
  FileImage,
  QrCode,
  MessageSquare,
  MessageCircle,
  Package,
  Receipt,
  ScanLine,
  Search,
  Settings,
  UserPlus,
  Users,
  WalletCards,
  X,
  Smartphone,
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
  FileImage,
  MessageCircle,
  Smartphone,
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
          style={{ alignItems: "flex-start", paddingTop: "72px", background: "rgba(0,0,0,0.5)" }}
        >
          <div
            style={{
              background: "#d4d0c8",
              borderTop: "2px solid #ffffff",
              borderLeft: "2px solid #ffffff",
              borderRight: "2px solid #404040",
              borderBottom: "2px solid #404040",
              outline: "1px solid #808080",
              maxWidth: "620px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Win95 Title Bar */}
            <div
              style={{
                background: "linear-gradient(90deg, #000080, #1084d0)",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "12px",
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                userSelect: "none",
                fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif"
              }}
            >
              <Search size={12} color="#ffffff" />
              <span>{mode === "command" ? "Command Palette" : "Quick Search"}</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 6px",
                background: "#d4d0c8",
                borderBottom: "1px solid #808080",
              }}
            >
              {mode === "command" ? (
                <Command size={18} style={{ color: "#000000" }} />
              ) : (
                <Search size={18} style={{ color: "#000000" }} />
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
                style={{
                  flex: 1,
                  background: "#ffffff",
                  borderTop: "2px solid #808080",
                  borderLeft: "2px solid #808080",
                  borderRight: "2px solid #ffffff",
                  borderBottom: "2px solid #ffffff",
                  padding: "2px 6px",
                  fontSize: "12px",
                  fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                  color: "#000",
                  WebkitTextFillColor: "#000",
                  outline: "none",
                }}
              />
              {loading && <Loader2 size={16} className="animate-spin" style={{ color: "#000000" }} />}
              <button
                onClick={closePalette}
                title="Close"
                style={{
                  background: "#d4d0c8",
                  borderTop: "2px solid #fff",
                  borderLeft: "2px solid #fff",
                  borderRight: "2px solid #404040",
                  borderBottom: "2px solid #404040",
                  padding: "1px 6px",
                  cursor: "default",
                  display: "flex",
                  alignItems: "center",
                  color: "#000000",
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div
              style={{
                maxHeight: "55vh",
                overflowY: "auto",
                background: "#ffffff",
                borderTop: "2px solid #808080",
                borderLeft: "2px solid #808080",
                borderRight: "2px solid #ffffff",
                borderBottom: "2px solid #ffffff",
                margin: "4px 6px 6px 6px",
              }}
            >
              {items.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#808080",
                    WebkitTextFillColor: "#808080",
                    fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif"
                  }}
                >
                  No results found
                </div>
              ) : (
                items.map((item, index) => {
                  const Icon = iconMap[item.icon];
                  const active = index === activeIndex;

                  return (
                    <button
                      key={`${item.source}-${item.id}`}
                      style={{
                        display: "flex",
                        width: "100%",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 6px",
                        textAlign: "left",
                        cursor: "default",
                        background: active ? "#000080" : "transparent",
                        color: active ? "#ffffff" : "#000000",
                        WebkitTextFillColor: active ? "#ffffff" : "#000000",
                        borderBottom: "1px solid #c0c0c0",
                        fontFamily: "'Tahoma', 'MS Sans Serif', sans-serif",
                        fontSize: "12px",
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => executeItem(item)}
                    >
                      <span
                        style={{
                          width: "20px",
                          height: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#d4d0c8",
                          flexShrink: 0,
                          borderTop: "1px solid #fff",
                          borderLeft: "1px solid #fff",
                          borderRight: "1px solid #808080",
                          borderBottom: "1px solid #808080",
                          color: active ? "#ffffff" : "#000080",
                        }}
                      >
                        <Icon size={14} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: active ? "#ffffff" : "#000000",
                            WebkitTextFillColor: active ? "#ffffff" : "#000000",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.title}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "11px",
                            color: active ? "#c0d0f0" : "#444",
                            WebkitTextFillColor: active ? "#c0d0f0" : "#444",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.subtitle}
                        </span>
                      </span>
                      {item.badge && (
                        <span
                          style={{
                            background: "#d4d0c8",
                            color: active ? "#ffffff" : "#000000",
                            borderTop: "1px solid #808080",
                            borderLeft: "1px solid #808080",
                            borderRight: "1px solid #ffffff",
                            borderBottom: "1px solid #ffffff",
                            padding: "1px 4px",
                            fontSize: "10px",
                            fontFamily: "Tahoma",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {item.shortcut && (
                        <kbd
                          style={{
                            background: "#d4d0c8",
                            color: active ? "#ffffff" : "#000000",
                            borderTop: "1px solid #ffffff",
                            borderLeft: "1px solid #ffffff",
                            borderRight: "1px solid #808080",
                            borderBottom: "1px solid #808080",
                            padding: "1px 5px",
                            fontSize: "10px",
                            fontFamily: "Tahoma",
                          }}
                        >
                          {shortcutLabel(item.shortcut)}
                        </kbd>
                      )}
                      <ChevronRight size={15} style={{ color: active ? "#ffffff" : "#808080" }} />
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
