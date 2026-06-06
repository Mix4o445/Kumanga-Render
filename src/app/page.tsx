import { getHomePageData } from "@/lib/data";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { MostPopularSection } from "@/components/sections/MostPopularSection";
import { LatestUpdatesSection } from "@/components/sections/LatestUpdatesSection";
import { Reveal } from "@/components/ui/motion";

export default async function HomePage() {
  const { featured, mostPopular, latestUpdates } = await getHomePageData();

  return (
    <div className="space-y-10 lg:space-y-12">
      <Reveal>
        <HeroCarousel items={featured} />
      </Reveal>

      <Reveal>
        <MostPopularSection items={mostPopular} />
      </Reveal>

      <Reveal>
        <LatestUpdatesSection items={latestUpdates} />
      </Reveal>
    </div>
  );
}
