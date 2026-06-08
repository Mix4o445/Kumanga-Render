"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Globe, CheckCircle2, FileText, BookOpen, Layers, Image as ImageIcon } from "lucide-react";

const inputClass =
  "w-full rounded-card border border-line bg-input px-4 py-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50";

const labelClass = "text-xs font-semibold text-fg-muted";
const hintClass = "text-xs text-fg-faint";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      {children}
      {hint ? <p className={hintClass}>{hint}</p> : null}
    </div>
  );
}

interface ScrapeResult {
  type?: string;
  imported?: number;
  skipped?: number;
  chaptersImported?: number;
  wouldImport?: number;
  wouldSkip?: number;
  chaptersToImport?: number;
  errors?: { url: string; error: string }[];
  stats?: {
    totalManga: number;
    totalChapters: number;
    totalPages: number;
    durationMs: number;
  };
  error?: string;
}

export function ScraperForm() {
  const [url, setUrl] = useState("");
  const [pages, setPages] = useState("1");
  const [concurrency, setConcurrency] = useState("3");
  const [delay, setDelay] = useState("1500");
  const [listPath, setListPath] = useState("/manga/");
  const [scrapeImages, setScrapeImages] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [autoApprove, setAutoApprove] = useState(true);
  const [cookies, setCookies] = useState("");
  const [userAgent, setUserAgent] = useState("");
  const [showCookies, setShowCookies] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          pages: parseInt(pages) || 1,
          concurrency: parseInt(concurrency) || 3,
          delay: parseInt(delay) || 1500,
          listPath: listPath || "/manga/",
          images: scrapeImages,
          dryRun,
          autoApprove,
          cookies: cookies || undefined,
          userAgent: userAgent || undefined,
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
          <Field label="رابط الموقع" hint="مثل: https://mangasite.com">
            <div className="relative">
              <Globe className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-faint" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className={`${inputClass} pr-10`}
                placeholder="https://example-manga.com"
              />
            </div>
          </Field>

          <Field label="عدد الصفحات" hint="0 = جميع الصفحات">
            <input value={pages} onChange={(e) => setPages(e.target.value)} className={inputClass} placeholder="1" />
          </Field>

          <Field label="التزامن" hint="عدد الطلبات المتزامنة">
            <input value={concurrency} onChange={(e) => setConcurrency(e.target.value)} className={inputClass} placeholder="3" />
          </Field>

          <Field label="التأخير (مللي)" hint="بين الطلبات">
            <input value={delay} onChange={(e) => setDelay(e.target.value)} className={inputClass} placeholder="1500" />
          </Field>

          <Field label="مسار القائمة" hint="مثل: /manga/">
            <input value={listPath} onChange={(e) => setListPath(e.target.value)} className={inputClass} placeholder="/manga/" />
          </Field>

          <div className="flex items-end gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-card border border-line bg-input px-4 py-3 text-sm text-fg transition-colors hover:border-line-strong">
              <input
                type="checkbox"
                checked={scrapeImages}
                onChange={(e) => setScrapeImages(e.target.checked)}
                className="size-4 accent-royal"
              />
              <ImageIcon className="size-4 text-fg-muted" />
              صور الفصول
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-card border border-line bg-input px-4 py-3 text-sm text-fg transition-colors hover:border-line-strong">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="size-4 accent-royal"
              />
              <FileText className="size-4 text-fg-muted" />
              تجربة فقط
            </label>
          </div>
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
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-fg-muted">
                  الكوكيز (Cookie header)
                </label>
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
                <label className="text-xs font-semibold text-fg-muted">
                  User-Agent (اختياري — لكن ضروري مع الكوكيز)
                </label>
                <input
                  value={userAgent}
                  onChange={(e) => setUserAgent(e.target.value)}
                  className="w-full rounded-card border border-line bg-input px-4 py-3 text-xs text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-royal/50"
                  dir="ltr"
                  placeholder="انسخ User-Agent من المتصفح: F12 → Network → أي طلب → Request Headers → User-Agent"
                />
              </div>
              <p className="text-xs text-fg-faint">
                افتح F12 &gt; Network &gt; اختر أي طلب &gt; انسخ <b>Cookie</b> و <b>User-Agent</b> من Request Headers. لازم يطابق User-Agent حق المتصفح اللي جبت منه الكوكيز عشان Cloudflare يقبل الطلب.
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => setAutoApprove(e.target.checked)}
              className="size-4 accent-royal"
            />
            موافقة تلقائية
          </label>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 rounded-card bg-royal px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-royal/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Globe className="size-4" />
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
          </h3>

          {result.error ? (
            <p className="flex items-center gap-2 text-sm text-rose-400">
              <AlertCircle className="size-4" />
              {result.error}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat icon={BookOpen} label="مانجا" value={result.type === "dry-run" ? result.wouldImport ?? 0 : result.imported ?? 0} />
              <Stat icon={Layers} label="فصول" value={result.type === "dry-run" ? result.chaptersToImport ?? 0 : result.chaptersImported ?? 0} />
              <Stat icon={FileText} label="مكرر" value={result.type === "dry-run" ? result.wouldSkip ?? 0 : result.skipped ?? 0} />
              <Stat icon={ImageIcon} label="صور" value={result.stats?.totalPages ?? 0} />
            </div>
          )}

          {result.stats ? (
            <div className="text-xs text-fg-faint">
              <span>{result.stats.totalManga} مانجا · {result.stats.totalChapters} فصل</span>
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
                  <li key={i} className="truncate text-rose-400">{e.url}: {e.error}</li>
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
