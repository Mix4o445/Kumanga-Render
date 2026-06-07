import {
  Home,
  Compass,
  Bookmark,
  Clock4,
  List,
  Library,
  Users,
  BadgeCheck,
  LayoutGrid,
  BarChart3,
  Star,
  Flame,
  Swords,
  Mountain,
  Laugh,
  Drama,
  Sparkles,
  Heart,
  Ghost,
  GraduationCap,
  Sword,
  Flower2,
  Skull,
  Gem,
  Wand2,
  DoorOpen,
  Rocket,
  Coffee,
  Trophy,
  Search,
  Zap,
  Brain,
  Landmark,
  Shield,
  Music,
  Hand,
  Bot,
  HeartCrack,
  Moon,
  Gamepad2,
  Utensils,
  Stethoscope,
  Fingerprint,
  Siren,
  Orbit,
  Star as StarIcon,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

import type {
  GenreNavItem,
  MangaStatus,
  NavSection,
} from "@/types";
import { GENRES } from "@/lib/db/seed-data";

/**
 * App information architecture (NOT content).
 * Navigation, genre icons and footer links live here; all manga
 * content flows in from the database layer.
 */

export const NAV_SECTIONS: NavSection[] = [
  {
    id: "browse",
    items: [
      { id: "home", label: "الرئيسية", href: "/", icon: Home },
      { id: "explore", label: "استكشاف", href: "/explore", icon: Compass },
      { id: "favorites", label: "قائمة المفضلة", href: "/favorites", icon: Bookmark },
      { id: "latest", label: "آخر التحديثات", href: "/latest", icon: Clock4 },
      { id: "manga", label: "قائمة المانجا", href: "/manga", icon: List },
      { id: "my-uploads", label: "أعمالي", href: "/my-uploads", icon: Library },
      { id: "community", label: "المجتمع", href: "/community", icon: Users },
    ],
  },
  {
    id: "discover",
    items: [
      { id: "completed", label: "المانجات المكتملة", href: "/completed", icon: BadgeCheck },
      { id: "genres", label: "المانجا حسب النوع", href: "/genres", icon: LayoutGrid },
      { id: "status", label: "المانجا حسب الحالة", href: "/status", icon: BarChart3 },
      { id: "top-rated", label: "الأعلى تقييمًا", href: "/top-rated", icon: Star },
      { id: "popular", label: "الأكثر شعبية", href: "/popular", icon: Flame },
    ],
  },
];

/** Genre slug → icon. Names/slugs come from the database (single source). */
const GENRE_ICONS: Record<string, LucideIcon> = {
  action: Swords,
  adventure: Mountain,
  comedy: Laugh,
  drama: Drama,
  fantasy: Sparkles,
  romance: Heart,
  horror: Ghost,
  school: GraduationCap,
  shounen: Sword,
  shoujo: Flower2,
  seinen: Skull,
  josei: Gem,
  supernatural: Wand2,
  isekai: DoorOpen,
  "sci-fi": Rocket,
  "slice-of-life": Coffee,
  sports: Trophy,
  mystery: Search,
  thriller: Zap,
  psychological: Brain,
  historical: Landmark,
  military: Shield,
  music: Music,
  "martial-arts": Hand,
  magic: Sparkles,
  mecha: Bot,
  harem: Heart,
  tragedy: HeartCrack,
  demons: Flame,
  vampire: Moon,
  game: Gamepad2,
  cooking: Utensils,
  medical: Stethoscope,
  "super-power": Zap,
  crime: Fingerprint,
  police: Siren,
  space: Orbit,
  "magical-girl": StarIcon,
  martial: Swords,
  mature: AlertTriangle,
};

export const GENRE_NAV: GenreNavItem[] = GENRES.map((g) => ({
  ...g,
  icon: GENRE_ICONS[g.slug] ?? LayoutGrid,
}));

export const STATUS_META: Record<
  MangaStatus,
  { label: string; tone: string; dot: string }
> = {
  ongoing: {
    label: "مستمرة",
    tone: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
    dot: "bg-emerald-400",
  },
  completed: {
    label: "مكتملة",
    tone: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
    dot: "bg-sky-400",
  },
  hiatus: {
    label: "متوقفة مؤقتًا",
    tone: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
    dot: "bg-amber-400",
  },
  cancelled: {
    label: "ملغاة",
    tone: "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/25",
    dot: "bg-zinc-400",
  },
};

export const FOOTER_LINKS: { label: string; href: string }[] = [
  { label: "اتصل بنا", href: "/contact" },
  { label: "سياسة المحتوى", href: "/content-policy" },
  { label: "شروط الخدمة", href: "/terms" },
  { label: "سياسة الخصوصية", href: "/privacy" },
];
