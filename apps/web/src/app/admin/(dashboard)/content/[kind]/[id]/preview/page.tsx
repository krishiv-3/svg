import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';
import { descriptorFor, isContentKind } from '@/lib/content-admin';

export const dynamic = 'force-dynamic';

interface PreviewRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  preview: boolean;
  body?: string[];
  description?: string[];
  shortDescription?: string;
  excerpt?: string;
  startAt?: string;
}

/** Authenticated preview of an unpublished activity, event or article. */
export default async function ContentPreviewPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;

  if (!isContentKind(kind)) notFound();

  const descriptor = descriptorFor(kind);
  const row = await adminGet<PreviewRow>(`/${kind}/${id}/preview`);

  if (row === null) notFound();

  const paragraphs = row.body ?? row.description ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-terracotta/40 bg-terracotta/10 px-4 py-3">
        <p className="text-[length:var(--text-label)] font-medium text-terracotta-ink">
          Preview — this is not the public page. Status: {row.status}
        </p>
        <Link
          href={`/admin/content/${kind}/${row.id}`}
          className="text-[length:var(--text-label)] text-terracotta-ink underline"
        >
          Back to editor
        </Link>
      </div>

      <article className="flex flex-col gap-4 rounded-2xl border border-sand bg-white p-6 shadow-soft">
        <Badge tone="neutral" size="sm">
          {row.status}
        </Badge>
        <h1 className="text-title text-cocoa">{row.title}</h1>
        {row.shortDescription === undefined ? null : (
          <p className="text-body text-charcoal/85">{row.shortDescription}</p>
        )}
        {row.excerpt === undefined ? null : (
          <p className="text-body text-charcoal/85 italic">{row.excerpt}</p>
        )}
        {row.startAt === undefined ? null : (
          <p className="text-[length:var(--text-label)] text-muted">
            Starts {row.startAt.slice(0, 16).replace('T', ' ')}
          </p>
        )}

        <div className="flex flex-col gap-3 border-t border-sand pt-4">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-body text-charcoal/85">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <p className="text-[length:var(--text-caption)] text-muted">
        Public URL once published: {descriptor.kind === 'news' ? '/news/' : `/${kind}/`}
        {row.slug}
      </p>
    </div>
  );
}
