import Link from "next/link";

export interface PolicySection {
  /** Anchor id used by the table of contents. */
  id: string;
  heading: string;
  paragraphs?: string[];
  /** Optional bullet points rendered under the paragraphs. */
  items?: string[];
}

interface PolicySectionsProps {
  /** Preamble paragraphs shown above the table of contents. */
  intro?: string[];
  sections: PolicySection[];
  /** Show a closing "contact us" note. */
  contact?: boolean;
}

/** Two-digit Arabic-Indic index, e.g. "٠٣". */
function num(n: number): string {
  return n.toLocaleString("ar", { minimumIntegerDigits: 2, useGrouping: false });
}

export function PolicySections({
  intro,
  sections,
  contact = true,
}: PolicySectionsProps) {
  return (
    <div className="max-w-3xl">
      {intro && intro.length > 0 ? (
        <div className="mb-8 space-y-3 rounded-card border border-line bg-surface-raised/40 p-5">
          {intro.map((paragraph, index) => (
            <p key={index} className="text-sm leading-7 text-fg-muted">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {/* Table of contents */}
      <nav
        aria-label="محتويات الصفحة"
        className="mb-10 rounded-card border border-line bg-surface-raised/40 p-5"
      >
        <h2 className="mb-3 text-sm font-bold tracking-tight text-fg">
          محتويات الصفحة
        </h2>
        <ol className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <Link
                href={`#${section.id}`}
                className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-fg-subtle transition-colors hover:bg-overlay hover:text-accent"
              >
                <span className="text-xs font-bold tabular-nums text-fg-faint transition-colors group-hover:text-accent">
                  {num(index + 1)}
                </span>
                <span className="truncate">{section.heading}</span>
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section, index) => (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-24 space-y-3"
          >
            <h2 className="flex items-center gap-3 text-lg font-bold tracking-tight text-fg">
              <span className="grid size-8 shrink-0 place-items-center rounded-card bg-accent/10 text-xs font-extrabold tabular-nums text-accent ring-1 ring-accent/20">
                {num(index + 1)}
              </span>
              {section.heading}
            </h2>

            {section.paragraphs?.map((paragraph, i) => (
              <p key={i} className="text-sm leading-7 text-fg-subtle">
                {paragraph}
              </p>
            ))}

            {section.items && section.items.length > 0 ? (
              <ul className="space-y-2 ps-1 pt-1">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-7 text-fg-subtle">
                    <span
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent/70"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      {contact ? (
        <div className="mt-12 rounded-card border border-line bg-surface-raised/40 p-5">
          <p className="text-sm leading-7 text-fg-muted">
            لأي استفسار بخصوص هذه الصفحة، يُرجى التواصل معنا عبر صفحة{" "}
            <Link
              href="/contact"
              className="font-bold text-accent transition-colors hover:text-accent-bright"
            >
              اتصل بنا
            </Link>
            .
          </p>
        </div>
      ) : null}
    </div>
  );
}
