"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Loader2, AlertCircle, Globe, CheckCircle2, Layers,
  Search, ChevronDown, Image as ImageIcon,
} from "lucide-react";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";
const labelClass = "text-xs font-semibold text-fg-muted";

interface MangaOption {
  slug: string;
  title: string;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      {children}
      {hint ? <p className="text-xs text-fg-faint">{hint}</p> : null}
    </div>
  );
}

interface ChapterScrapeResult {
  type?: string;
  title?: string;
  chapters?: number;
  pages?: number;
  imported?: number;
  skipped?: number;
  errors?: { url: string; error: string }[] | string[];
  stats?: {
    totalChapters: number;
    totalPages: number;
    durationMs: number;
  };
  error?: string;
}

export function ChapterScraperForm({ mangaList }: { mangaList: MangaOption[] }) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mangaUrl, setMangaUrl] = useState("");
  const [concurrency, setConcurrency] = useState("3");
  const [delay, setDelay] = useState("1500");
  const [scrapeImages, setScrapeImages] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  const [overwrite, setOverwrite] = useState(false);
  const [cookies, setCookies] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChapterScrapeResult | null>(null);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mangaUrl.trim() || !selectedSlug) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/scrape/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaUrl: mangaUrl.trim(),
          slug: selectedSlug,
          concurrency: parseInt(concurrency) || 3,
          delay: parseInt(delay) || 1500,
          images: scrapeImages,
          dryRun,
          autoApprove,
          overwrite,
          cookies: cookies || undefined,
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
          <Field label="المانجا المستهدفة" hint="اختر مانجا من موقعك">
            <div ref={dropdownRef} className="relative">
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
          </Field>

          <Field label="رابط المانجا" hint="الرابط من موقع Madara">
            <div className="relative">
              <Globe className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
              <input
                value={mangaUrl}
                onChange={(e) => setMangaUrl(e.target.value)}
                required
                className={`${inputClass} pr-10`}
                placeholder="https://mangasite.com/manga/one-piece/"
                dir="ltr"
              />
            </div>
          </Field>

          <Field label="التزامن" hint="عدد الطلبات المتزامنة">
            <input value={concurrency} onChange={(e) => setConcurrency(e.target.value)} className={inputClass} />
          </Field>

          <Field label="التأخير (مللي)" hint="بين الطلبات">
            <input value={delay} onChange={(e) => setDelay(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={scrapeImages}
              onChange={(e) => setScrapeImages(e.target.checked)}
              className="size-4 accent-royal"
            />
            <ImageIcon className="size-4" />
            سكريب صور الفصول
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="size-4 accent-royal"
            />
            تجربة فقط
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="size-4 accent-royal"
            />
            موافقة تلقائية
          </label>

        </div>

        <div className="border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowCookies(!showCookies)}
            className="mb-3 flex items-center gap-2 text-xs font-bold text-fg-muted transition-colors hover:text-fg"
          >
            {showCookies ? "▼" : "▶"} {showCookies ? "إخفاء" : "إضافة"} كوكيز (لـ Cloudflare)
          </button>

          {showCookies ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-fg-muted">الكوكيز</label>
              <textarea
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                className="w-full rounded-card border border-line bg-input px-4 py-3 text-xs text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50"
                rows={3}
                dir="ltr"
                placeholder="افتح الموقع في المتصفح → F12 → Network → اختر طلب → انسخ Cookie header"
              />
              <p className="text-xs text-fg-faint">
                افتح الموقع في متصفحك، F12 &gt; Network &gt; اختر أي طلب &gt; انسخ قيمة Cookie Header.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
          <button
            type="submit"
            disabled={loading || !mangaUrl.trim() || !selectedSlug}
            className="mr-auto inline-flex items-center gap-2 rounded-card bg-royal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-royal/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Layers className="size-4" />
            )}
            {loading ? "جارٍ السكريب..." : dryRun ? "تجربة" : "سكريب واستيراد"}
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
            {result.type === "dry-run" ? "نتيجة التجربة" : "تم الاستيراد"}
            {result.title ? (
              <span className="text-fg-muted">— {result.title}</span>
            ) : null}
          </h3>

          {result.error ? (
            <p className="flex items-center gap-2 text-sm text-rose-400">
              <AlertCircle className="size-4" />
              {result.error}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={Layers} label="فصول" value={result.type === "dry-run" ? result.chapters ?? 0 : result.imported ?? 0} />
              <Stat icon={ImageIcon} label="صور" value={result.pages ?? result.stats?.totalPages ?? 0} />
              <Stat icon={AlertCircle} label="مكرر/متخطى" value={result.type === "dry-run" ? 0 : result.skipped ?? 0} />
              <Stat icon={CheckCircle2} label="أخطاء" value={result.errors?.length ?? 0} />
            </div>
          )}

          {result.stats ? (
            <div className="text-xs text-fg-faint">
              <span>{result.stats.totalChapters} فصل</span>
              <span className="mx-2">·</span>
              <span>{(result.stats.durationMs / 1000).toFixed(1)} ثانية</span>
            </div>
          ) : null}

          {result.errors && result.errors.length > 0 ? (
            <details className="text-xs text-fg-subtle">
              <summary className="cursor-pointer font-medium">
                أخطاء ({result.errors.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {result.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="truncate text-rose-400">
                    {typeof e === "string" ? e : `${e.url}: ${e.error}`}
                  </li>
                ))}
                {result.errors.length > 20 ? (
                  <li className="text-fg-faint">...و{result.errors.length - 20} خطأً آخر</li>
                ) : null}
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
