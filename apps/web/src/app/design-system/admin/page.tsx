import type { Metadata } from 'next';

import {
  ActionMenu,
  AdminContent,
  AdminHeader,
  AdminShell,
  DataTable,
  FilterBar,
  FormSection,
  StatCard,
  StatusBadge,
  UserMenu,
  type DataTableColumn,
} from '@/components/admin';
import { CameraIcon, FileTextIcon, InboxIcon, ReceiptIcon } from '@/components/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Pagination,
  SearchInput,
  Select,
  SkipLink,
} from '@/components/ui';

import { AdminDialogDemo } from './admin-dialog-demo';

/**
 * Admin design language reference.
 *
 * Shares brand tokens with the public site but optimises for clarity: white
 * surfaces, denser type, table-first layout and explicit status colours.
 *
 * All figures are placeholders ("—"). No Gaushala statistics are invented here;
 * real values arrive from the API in Phase 8.
 */

export const metadata: Metadata = {
  title: 'Admin design language',
  robots: { index: false, follow: false },
};

interface SampleRow {
  id: string;
  title: string;
  status: string;
  updated: string;
  owner: string;
}

const SAMPLE_ROWS: readonly SampleRow[] = [
  { id: '1', title: 'Sample item 01', status: 'PUBLISHED', updated: '—', owner: '—' },
  { id: '2', title: 'Sample item 02', status: 'SCHEDULED', updated: '—', owner: '—' },
  { id: '3', title: 'Sample item 03', status: 'DRAFT', updated: '—', owner: '—' },
];

const COLUMNS: readonly DataTableColumn<SampleRow>[] = [
  {
    key: 'title',
    header: 'Title',
    cell: (row) => <span className="font-medium text-cocoa">{row.title}</span>,
  },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
  { key: 'owner', header: 'Last edited by', cell: (row) => row.owner },
  { key: 'updated', header: 'Updated', cell: (row) => row.updated },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    cell: () => (
      <ActionMenu
        label="Actions for this item"
        items={[
          { label: 'Edit', href: '#tables' },
          { label: 'Preview', href: '#tables' },
          { label: 'Archive', href: '#tables' },
          { label: 'Delete', href: '#tables', tone: 'danger' },
        ]}
      />
    ),
  },
];

const STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
  'NEW',
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'ACTIVE',
  'SUSPENDED',
] as const;

export default function AdminDesignSystemPage() {
  return (
    <>
      <SkipLink />
      <AdminShell activeHref="/admin">
        <AdminHeader
          title="Dashboard"
          description="Admin design language — component reference, not live data."
          search={
            <SearchInput id="admin-header-search" placeholder="Search anything…" className="w-52" />
          }
          actions={
            <>
              <Button size="sm">Primary action</Button>
              <UserMenu name="Demo Admin" role="Super Admin" email="admin@demo.invalid" />
            </>
          }
        />

        <AdminContent>
          <Alert tone="info" title="Reference page">
            Values below are placeholders. The admin dashboard itself, its permissions and its real
            data are built in Phase 8.
          </Alert>

          {/* ------------------------------------------------------- metrics */}
          <section aria-labelledby="admin-metrics" className="flex flex-col gap-3">
            <h2
              id="admin-metrics"
              className="text-[length:var(--text-subheading)] font-semibold text-cocoa"
            >
              Operational summary
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Published pages"
                value="—"
                hint="Live on the public site"
                icon={<FileTextIcon size={18} />}
              />
              <StatCard
                label="Pending enquiries"
                value="—"
                hint="Awaiting a response"
                icon={<InboxIcon size={18} />}
              />
              <StatCard
                label="Verified donations"
                value="—"
                hint="Confirmed by the provider only"
                icon={<ReceiptIcon size={18} />}
              />
              <StatCard
                label="Media files"
                value="—"
                hint="Images and documents"
                icon={<CameraIcon size={18} />}
              />
            </div>
          </section>

          {/* --------------------------------------------------------- table */}
          <section aria-labelledby="admin-table" className="flex flex-col gap-3">
            <h2
              id="admin-table"
              className="text-[length:var(--text-subheading)] font-semibold text-cocoa"
            >
              Tables and filters
            </h2>

            <FilterBar
              searchId="admin-sample-search"
              searchLabel="Search"
              searchPlaceholder="Search by title…"
              filters={
                <div className="w-full sm:w-44">
                  <Select
                    name="admin-status-filter"
                    label="Status"
                    placeholder="All statuses"
                    options={[
                      { value: 'draft', label: 'Draft' },
                      { value: 'published', label: 'Published' },
                    ]}
                  />
                </div>
              }
              actions={
                <Button size="sm" variant="secondary">
                  Export
                </Button>
              }
            />

            <DataTable
              caption="Sample content list demonstrating table styling"
              columns={COLUMNS}
              rows={SAMPLE_ROWS}
              getRowKey={(row) => row.id}
            />

            <Pagination
              currentPage={1}
              totalPages={6}
              hrefFor={(page) => `#page-${String(page)}`}
              label="Content list pagination"
            />
          </section>

          {/* ------------------------------------------------------ statuses */}
          <section aria-labelledby="admin-status" className="flex flex-col gap-3">
            <h2
              id="admin-status"
              className="text-[length:var(--text-subheading)] font-semibold text-cocoa"
            >
              Status indicators
            </h2>

            <Card padding="md" className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <StatusBadge key={status} status={status} />
              ))}
            </Card>
          </section>

          {/* ---------------------------------------------------------- form */}
          <section aria-labelledby="admin-form" className="flex flex-col gap-3">
            <h2
              id="admin-form"
              className="text-[length:var(--text-subheading)] font-semibold text-cocoa"
            >
              Form layout
            </h2>

            <FormSection
              title="Page details"
              description="Two columns on wide screens, one on small screens."
              aside={
                <p>
                  Admin forms use the same field components as the public site, with tighter
                  spacing. Required fields are marked and validated on the server.
                </p>
              }
            >
              <Input name="admin-title" label="Title" placeholder="Page title" required />
              <Input
                name="admin-slug"
                label="Slug"
                placeholder="page-slug"
                hint="Lowercase, hyphens only."
              />
              <Input
                name="admin-seo-title"
                label="SEO title"
                placeholder="Title for search results"
              />
              <Select
                name="admin-template"
                label="Template"
                placeholder="Choose a template"
                options={[
                  { value: 'generic', label: 'Generic page' },
                  { value: 'landing', label: 'Landing page' },
                ]}
              />
              <div className="sm:col-span-2">
                <Checkbox
                  name="admin-noindex"
                  label="Exclude from search engines"
                  description="Adds noindex to this page only."
                />
              </div>
            </FormSection>

            <div className="flex flex-wrap items-end gap-3">
              <Button size="md">Save draft</Button>
              <Button size="md" variant="secondary">
                Preview
              </Button>
              <AdminDialogDemo />
            </div>
          </section>

          {/* --------------------------------------------------- admin rules */}
          <section aria-labelledby="admin-rules" className="flex flex-col gap-3">
            <h2
              id="admin-rules"
              className="text-[length:var(--text-subheading)] font-semibold text-cocoa"
            >
              Admin design rules
            </h2>

            <div className="grid gap-4 md:grid-cols-3">
              <Card tone="muted" padding="md" className="flex flex-col gap-2">
                <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Density</p>
                <p className="text-[length:var(--text-caption)] text-muted">
                  Admin type is one step smaller than the public site and spacing is tighter, so
                  more rows fit without scrolling.
                </p>
              </Card>

              <Card tone="muted" padding="md" className="flex flex-col gap-2">
                <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Colour</p>
                <p className="text-[length:var(--text-caption)] text-muted">
                  White surfaces dominate; terracotta marks the single primary action per screen and
                  status colours carry state.
                </p>
              </Card>

              <Card tone="muted" padding="md" className="flex flex-col gap-2">
                <p className="text-[length:var(--text-label)] font-semibold text-cocoa">Safety</p>
                <p className="text-[length:var(--text-caption)] text-muted">
                  Destructive actions are always behind a confirmation that names the object and
                  never becomes the default focus target.
                </p>
              </Card>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">Admin reference</Badge>
            <Badge tone="brand">Phase 3</Badge>
          </div>
        </AdminContent>
      </AdminShell>
    </>
  );
}
