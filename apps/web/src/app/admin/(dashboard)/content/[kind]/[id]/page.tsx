import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@/components/ui';
import { adminGet } from '@/lib/admin';
import { descriptorFor, isContentKind } from '@/lib/content-admin';

import { ContentForm } from '../content-form';

export const dynamic = 'force-dynamic';

interface Detail {
  id: string;
  slug: string;
  status: string;
  version: number;
  [key: string]: unknown;
}

export default async function ContentEditorPage({
  params,
}: {
  params: Promise<{ kind: string; id: string }>;
}) {
  const { kind, id } = await params;

  if (!isContentKind(kind)) notFound();

  const descriptor = descriptorFor(kind);
  const isNew = id === 'new';
  const detail = isNew ? null : await adminGet<Detail>(`/${kind}/${id}`);

  if (!isNew && detail === null) notFound();

  const categories =
    kind === 'news' ? await adminGet<{ id: string; name: string }[]>('/news-categories') : null;

  const initial: Record<string, string | boolean> = {};

  for (const field of descriptor.fields) {
    if (field.type === 'checkbox') {
      initial[field.key] = detail?.[field.key] === true;
      continue;
    }

    if (field.type === 'datetime') {
      const value = typeof detail?.[field.key] === 'string' ? (detail[field.key] as string) : '';
      initial[field.key] = value === '' ? '' : value.slice(0, 16);
      continue;
    }

    const value = detail?.[field.key];
    initial[field.key] = value === null || value === undefined ? '' : String(value);
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Link
          href={`/admin/content/${kind}`}
          className="text-[length:var(--text-label)] text-terracotta-ink hover:underline"
        >
          ← {descriptor.plural}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-title text-cocoa">
            {isNew ? `New ${descriptor.singular.toLowerCase()}` : String(detail?.title ?? '')}
          </h1>
          {detail === null ? null : (
            <Badge tone={detail.status === 'PUBLISHED' ? 'success' : 'neutral'} size="sm">
              {detail.status}
            </Badge>
          )}
        </div>
        {detail === null ? (
          <p className="text-body-sm text-charcoal/80">
            Saved as a draft. It becomes public only when published.
          </p>
        ) : (
          <p className="text-[length:var(--text-caption)] text-muted">
            Version {detail.version} · <span className="font-mono">/{detail.slug}</span>
          </p>
        )}
      </header>

      <div className="rounded-2xl border border-sand bg-white p-5 shadow-soft sm:p-6">
        <ContentForm
          descriptor={descriptor}
          initial={initial}
          mode={isNew ? 'create' : 'edit'}
          version={detail?.version ?? 1}
          {...(detail === null ? {} : { id: detail.id })}
          {...(categories === null ? {} : { categories })}
        />
      </div>
    </div>
  );
}
