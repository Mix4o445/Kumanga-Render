"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Loader2, AlertCircle, Globe, CheckCircle2, Image,
  Search, ChevronDown, Layers,
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

interface Result {
  chapterNumber?: number;
  pages?: number;
  newChapter?: boolean;
  stats?: { durationMs: number };
  error?: string;
}

export function SingleChapterForm({ mangaList }: { mangaList: MangaOption[] }) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [chapterUrl, setChapterUrl] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [cookies, setCookies] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => mangaList.filter((m) => m.title.includes(searchQuery) || m.slug.includes(searchQuery)),
    [searchQuery, mangaList],
  );

  const selectedManga = useMemo(
    () => mangaList.find((m) => m.slug === selectedSlug),
    [selectedSlug, mangaList],
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chapterUrl.trim() || !selectedSlug) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/scrape/chapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterUrl: chapterUrl.trim(),
          mangaSlug: selectedSlug,
          chapterNumber: chapterNumber ? parseFloat(chapterNumber) : undefined,
          cookies: cookies || undefined,
          userAgent: userAgent || undefined,
        }),
      });
      let data: Result;
      try {
        data = await res.json();
      } catch {
        const text = await res.text();
        setError(`الخادم أعاد استجابة غير JSON (HTTP ${res.status}): ${text.slice(0, 200)}`);
        return;
      }
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
        <Field label="اختر المانجا" hint="المانجا الموجودة حاليًا في المخزن">
          <div ref={dropdownRef} className="relative">
            <div
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`${inputClass} flex cursor-pointer items-center justify-between`}
            >
              <span className={selectedManga ? "text-fg" : "text-fg-faint"}>
                {selectedManga ? selectedManga.title : "ابحث عن مانجا..."}
              </span>
              <ChevronDown className="size-4 text-fg-muted" />
            </div>
            {dropdownOpen ? (
              <div className="absolute z-10 mt-1 w-full rounded-card border border-line bg-surface shadow-lg">
                <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                  <Search className="size-4 text-fg-muted" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
                    placeholder="ابحث..."
                  />
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <li className="px-3 py-4 text-center text-xs text-fg-faint">لا توجد نتائج</li>
                  ) : (
                    filtered.map((m) => (
                      <li
                        key={m.slug}
                        onClick={() => {
                          setSelectedSlug(m.slug);
                          setDropdownOpen(false);
                          setSearchQuery("");
                        }}
                        className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-overlay ${
                          selectedSlug === m.slug ? "bg-royal/10 text-royal" : "text-fg"
                        }`}
                      >
                        {m.title}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>
        </Field>

        <Field label="رابط الفصل" hint="الرابط الكامل لصفحة الفصل على موقع Madara">
          <div className="relative">
            <Globe className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
            <input
              value={chapterUrl}
              onChange={(e) => setChapterUrl(e.target.value)}
              required
              className={`${inputClass} pr-10`}
              placeholder="https://rocksmanga.com/manga/chainsaw-man/1/"
            />
          </div>
        </Field>

        <Field label="رقم الفصل (اختياري)" hint="يُستخرج تلقائيًا من الرابط إن تُرك فارغًا">
          <input
            value={chapterNumber}
            onChange={(e) => setChapterNumber(e.target.value)}
            className={inputClass}
            placeholder="مثال: 1"
          />
        </Field>

        <div className="border-t border-line pt-4">
          <button
            type="button"
            onClick={() => setShowCookies(!showCookies)}
            className="mb-3 flex items-center gap-2 text-xs font-bold text-fg-muted transition-colors hover:text-fg"
          >
            {showCookies ? "▼" : "▶"} {showCookies ? "إخفاء" : "إضافة"} كوكيز (لـ Cloudflare)
          </button>
          {showCookies ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg-muted">الكوكيز (Cookie header)</label>
                <textarea
                  value={cookies}
                  onChange={(e) => setCookies(e.target.value)}
                  className="w-full rounded-card border border-line bg-input px-4 py-3 text-xs text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50"
                  rows={3}
                  dir="ltr"
                  placeholder="انسخ Cookie header كاملاً من المتصفح"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg-muted">User-Agent (اختياري)</label>
                <input
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className="w-full rounded-card border border-line bg-input px-4 py-3 text-xs text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50"
                  dir="ltr"
                  placeholder="انسخ User-Agent من المتصفح"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="submit"
            disabled={loading || !chapterUrl.trim() || !selectedSlug}
            className="inline-flex items-center gap-2 rounded-card bg-royal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-royal/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Image className="size-4" />}
            {loading ? "جارٍ السكريب..." : "سكريب الفصل"}
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
            تم استيراد الفصل
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Layers} label="رقم الفصل" value={String(result.chapterNumber ?? "—")} />
            <Stat icon={Image} label="عدد الصور" value={String(result.pages ?? 0)} />
            <Stat icon={CheckCircle2} label="فصل جديد" value={result.newChapter ? "نعم" : "لا"} />
          </div>
          {result.stats ? (
            <div className="text-xs text-fg-faint">
              <span>{(result.stats.durationMs / 1000).toFixed(1)} ثانية</span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-card bg-overlay px-3 py-2.5">
      <Icon className="size-4 text-fg-muted" />
      <div className="min-w-0">
        <p className="text-lg font-extrabold text-fg">{value}</p>
        <p className="text-xs text-fg-faint">{label}</p>
      </div>
    </div>
  );
}
