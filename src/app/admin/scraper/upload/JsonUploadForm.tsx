"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Loader2, AlertCircle, CheckCircle2, Upload, Search, ChevronDown,
  Layers, FileText,
} from "lucide-react";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

interface MangaOption {
  slug: string;
  title: string;
}

interface UploadResult {
  imported?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
}

export function JsonUploadForm({ mangaList }: { mangaList: MangaOption[] }) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jsonPreview, setJsonPreview] = useState("");
  const [autoApprove, setAutoApprove] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedManga = mangaList.find((m) => m.slug === selectedSlug);

  const filtered = useMemo(
    () =>
      searchQuery
        ? mangaList.filter((m) =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : mangaList,
    [mangaList, searchQuery],
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectManga(slug: string) {
    setSelectedSlug(slug);
    setDropdownOpen(false);
    setSearchQuery("");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    setResult(null);
    // Read first few bytes for preview
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          setJsonPreview(`${parsed.length} chapters in JSON array`);
        } else if (parsed.chapters) {
          setJsonPreview(`${parsed.chapters.length} chapters`);
        } else {
          setJsonPreview("Valid JSON (unknown format)");
        }
      } catch {
        setJsonPreview("Invalid JSON file");
        setError("الملف ليس JSON صالحًا");
      }
    };
    reader.readAsText(f.slice(0, 65536)); // First 64KB for preview
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlug || !file) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const text = await file.text();
      let chapters: unknown;

      try {
        const parsed = JSON.parse(text);
        chapters = Array.isArray(parsed) ? parsed : (parsed as any).chapters;
      } catch {
        setError("الملف لا يحتوي على JSON صالح");
        setLoading(false);
        return;
      }

      if (!Array.isArray(chapters) || chapters.length === 0) {
        setError("الملف يجب أن يحتوي على مصفوفة فصول أو حقل chapters");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/scrape/upload-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          chapters,
          autoApprove,
          overwrite,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-card border border-line bg-surface-raised/40 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-fg-muted">المانجا المستهدفة</label>
            <div ref={dropdownRef} className="relative mt-1.5">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`${inputClass} flex items-center justify-between gap-2 text-right`}
              >
                <span className={selectedManga ? "" : "text-fg-faint"}>
                  {selectedManga ? selectedManga.title : "اختر مانجا..."}
                </span>
                <ChevronDown className={`size-4 shrink-0 text-fg-muted transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-card border border-line bg-surface shadow-lg">
                  <div className="relative border-b border-line">
                    <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent px-4 py-2.5 pr-10 text-sm text-fg outline-none placeholder:text-fg-faint"
                      placeholder="بحث..."
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filtered.length > 0 ? (
                      filtered.map((m) => (
                        <button
                          key={m.slug}
                          type="button"
                          onClick={() => selectManga(m.slug)}
                          className={`w-full px-4 py-2 text-right text-sm transition-colors hover:bg-overlay ${
                            m.slug === selectedSlug
                              ? "bg-royal/10 text-royal font-bold"
                              : "text-fg"
                          }`}
                        >
                          {m.title}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-fg-faint">لا توجد نتائج</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-fg-muted">ملف JSON</label>
            <div className="mt-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`${inputClass} flex items-center justify-center gap-2 py-6`}
              >
                <Upload className="size-5 text-fg-muted" />
                <span className="text-fg-muted">
                  {file ? file.name : "اختر ملف JSON"}
                </span>
              </button>
              {jsonPreview ? (
                <p className="mt-1 text-xs text-fg-faint">{jsonPreview}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="size-4 accent-royal"
            />
            موافقة تلقائية
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="size-4 accent-royal"
            />
            استبدال الموجود
          </label>

          <button
            type="submit"
            disabled={loading || !selectedSlug || !file}
            className="mr-auto inline-flex items-center gap-2 rounded-card bg-royal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-royal/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {loading ? "جارٍ الرفع..." : "رفع واستيراد"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="flex items-start gap-3 rounded-card border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4 rounded-card border border-line bg-surface-raised/40 p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-fg">
            <CheckCircle2 className="size-4 text-emerald-400" />
            تم الاستيراد
          </h3>

          {result.error ? (
            <p className="flex items-center gap-2 text-sm text-rose-400">
              <AlertCircle className="size-4" />
              {result.error}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat icon={Layers} label="فصول مستوردة" value={result.imported ?? 0} />
              <Stat icon={FileText} label="مكرر/متخطى" value={result.skipped ?? 0} />
              <Stat icon={AlertCircle} label="أخطاء" value={result.errors?.length ?? 0} />
            </div>
          )}

          {result.errors && result.errors.length > 0 ? (
            <details className="text-xs text-fg-subtle">
              <summary className="cursor-pointer font-medium">
                أخطاء ({result.errors.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="truncate text-rose-400">{e}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 rounded-card bg-overlay px-3 py-2.5">
      <Icon className="size-4 text-fg-muted" />
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-fg">{value.toLocaleString("ar")}</p>
        <p className="text-xs text-fg-faint">{label}</p>
      </div>
    </div>
  );
}
