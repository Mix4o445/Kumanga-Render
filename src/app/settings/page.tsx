"use client";

import Link from "next/link";
import {
  Settings as SettingsIcon,
  Palette,
  BookOpen,
  Bell,
  UserCog,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  SETTINGS_KEYS,
  useStored,
  useStoredBool,
  useTheme,
  type ReaderMode,
  type ReaderQuality,
  type ThemeMode,
} from "@/lib/clientSettings";
import { cn } from "@/lib/utils";

function Panel({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-surface-raised/40 p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-card bg-accent/10 text-accent ring-1 ring-accent/20">
          <Icon className="size-5" strokeWidth={2.25} aria-hidden />
        </span>
        <h2 className="text-base font-bold tracking-tight text-fg">{title}</h2>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-fg">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-fg-faint">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-6 w-11 rounded-pill transition-colors active:scale-95",
        on ? "bg-accent" : "bg-overlay-strong",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          on ? "start-0.5" : "start-5",
        )}
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-pill border border-line bg-input p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors",
            value === option.value
              ? "bg-accent text-white"
              : "text-fg-subtle hover:text-fg",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const [theme, setTheme] = useTheme();
  const [readingMode, setReadingMode] = useStored<ReaderMode>(
    SETTINGS_KEYS.readerMode,
    "vertical",
  );
  const [quality, setQuality] = useStored<ReaderQuality>(
    SETTINGS_KEYS.readerQuality,
    "high",
  );
  const [notifyUpdates, setNotifyUpdates] = useStoredBool(
    SETTINGS_KEYS.notifyUpdates,
    true,
  );
  const [notifyReplies, setNotifyReplies] = useStoredBool(
    SETTINGS_KEYS.notifyReplies,
    false,
  );

  return (
    <div>
      <header className="mb-8 flex items-center gap-4 border-b border-line pb-6">
        <span className="grid size-12 place-items-center rounded-card bg-accent/10 text-accent ring-1 ring-accent/20">
          <SettingsIcon className="size-6" strokeWidth={2.25} aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg">
            الإعدادات
          </h1>
          <p className="mt-1 text-sm text-fg-subtle">
            خصّص تجربتك على المنصة كما يحلو لك. تُحفظ تغييراتك تلقائيًا.
          </p>
        </div>
      </header>

      <div className="grid max-w-3xl gap-6">
        <Panel icon={UserCog} title="الحساب">
          <Row
            label="الملف الشخصي"
            description="عدّل صورتك الرمزية وغلافك واسمك المعروض ورابطك ونبذتك."
          >
            <Link
              href="/settings/profile"
              className="inline-flex items-center gap-1 rounded-pill border border-line bg-overlay px-4 py-2 text-xs font-bold text-fg-muted transition-colors hover:bg-overlay-strong hover:text-fg active:scale-95"
            >
              تعديل
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          </Row>
        </Panel>

        <Panel icon={Palette} title="المظهر">
          <Row label="السمة" description="اختر بين الوضع الداكن والفاتح والتلقائي.">
            <SegmentedControl<ThemeMode>
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: "داكن" },
                { value: "light", label: "فاتح" },
                { value: "system", label: "تلقائي" },
              ]}
            />
          </Row>
        </Panel>

        <Panel icon={BookOpen} title="تفضيلات القراءة">
          <Row label="اتجاه القراءة" description="طريقة تصفّح صفحات الفصل.">
            <SegmentedControl<ReaderMode>
              value={readingMode}
              onChange={setReadingMode}
              options={[
                { value: "vertical", label: "عمودي" },
                { value: "horizontal", label: "أفقي" },
              ]}
            />
          </Row>
          <Row label="جودة الصور" description="«توفير» يؤجّل تحميل الصفحات لتقليل البيانات.">
            <SegmentedControl<ReaderQuality>
              value={quality}
              onChange={setQuality}
              options={[
                { value: "high", label: "عالية" },
                { value: "medium", label: "متوسطة" },
                { value: "data", label: "توفير" },
              ]}
            />
          </Row>
        </Panel>

        <Panel icon={Bell} title="الإشعارات">
          <Row label="فصول جديدة" description="تنبيه عند صدور فصل من أعمالك المفضلة.">
            <Toggle on={notifyUpdates} onChange={setNotifyUpdates} />
          </Row>
          <Row label="الردود في المجتمع" description="تنبيه عند الرد على نقاشاتك.">
            <Toggle on={notifyReplies} onChange={setNotifyReplies} />
          </Row>
        </Panel>
      </div>
    </div>
  );
}
