import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AdminContent, AdminHeader, AdminShell } from './admin-shell';
import { DataTable, type DataTableColumn } from './data-table';
import { FilterBar, StatusBadge } from './filter-bar';
import { FormSection } from './form-section';
import { StatCard } from './stat-card';

const render = (element: ReactElement): string => renderToStaticMarkup(element);

interface Row {
  id: string;
  title: string;
  status: string;
}

const rows: Row[] = [
  { id: '1', title: 'Sample item 01', status: 'PUBLISHED' },
  { id: '2', title: 'Sample item 02', status: 'DRAFT' },
];

const columns: DataTableColumn<Row>[] = [
  { key: 'title', header: 'Title', cell: (row) => row.title },
  { key: 'status', header: 'Status', cell: (row) => <StatusBadge status={row.status} /> },
];

describe('data table', () => {
  it('provides a caption and column scopes for assistive technology', () => {
    const html = render(
      <DataTable
        caption="Sample content list"
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
      />,
    );

    expect(html).toContain('<caption');
    expect(html).toContain('Sample content list');
    expect(html).toContain('scope="col"');
    expect(html).toContain('<th');
  });

  it('renders one row per record', () => {
    const html = render(
      <DataTable caption="List" columns={columns} rows={rows} getRowKey={(r) => r.id} />,
    );

    expect((html.match(/<tr/g) ?? []).length).toBe(3); // header + 2 rows
    expect(html).toContain('Sample item 01');
  });

  it('explains an empty result instead of rendering nothing', () => {
    const html = render(
      <DataTable
        caption="Empty list"
        columns={columns}
        rows={[]}
        getRowKey={(r) => r.id}
        emptyMessage="No records to show."
      />,
    );

    expect(html).toContain('No records to show.');
    // React serialises the attribute as `colSpan`; compare case-insensitively.
    expect(html.toLowerCase()).toContain('colspan="2"');
  });
});

describe('status indicators', () => {
  it('uses human labels rather than raw enum values', () => {
    expect(render(<StatusBadge status="PUBLISHED" />)).toContain('Published');
    expect(render(<StatusBadge status="SCHEDULED" />)).toContain('Scheduled');
    expect(render(<StatusBadge status="SUCCEEDED" />)).toContain('Verified');
  });

  it('falls back to the raw value for unknown statuses', () => {
    expect(render(<StatusBadge status="SOMETHING_NEW" />)).toContain('SOMETHING_NEW');
  });
});

describe('administrative layout', () => {
  it('renders stat cards with a label and a placeholder value', () => {
    const html = render(
      <StatCard label="Published pages" value="—" hint="Live on the public site" />,
    );

    expect(html).toContain('Published pages');
    expect(html).toContain('—');
    expect(html).toContain('Live on the public site');
  });

  it('labels the admin search field', () => {
    const html = render(<FilterBar searchId="q" searchLabel="Search" />);
    expect(html).toContain('for="q"');
    expect(html).toContain('id="q"');
  });

  it('marks the current admin section', () => {
    const html = render(
      <AdminShell
        activeHref="/admin"
        groups={[{ title: 'Content', items: [{ label: 'Dashboard', href: '/admin', icon: null }] }]}
      >
        <p>Content</p>
      </AdminShell>,
    );

    expect(html).toContain('aria-current="page"');
  });

  it('renders a single h1 in the admin header', () => {
    const html = render(<AdminHeader title="Dashboard" />);
    expect((html.match(/<h1/g) ?? []).length).toBe(1);
  });

  it('groups form fields under a heading', () => {
    const html = render(
      <FormSection title="Page details">
        <input name="title" aria-label="Title" />
      </FormSection>,
    );

    expect(html).toContain('Page details');
    expect(html).toContain('<h2');
  });

  it('provides a main landmark in the admin shell', () => {
    const html = render(
      <AdminShell groups={[]}>
        <AdminContent>
          <p>Body</p>
        </AdminContent>
      </AdminShell>,
    );

    expect(html).toContain('id="main-content"');
  });
});
