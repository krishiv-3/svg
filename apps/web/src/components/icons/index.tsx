import type { ReactNode, SVGProps } from 'react';

/**
 * Icon set.
 *
 * A single hand-drawn line family (24×24 grid, 1.75 stroke, round caps) keeps
 * the interface visually consistent without adding an icon dependency. Icons
 * inherit `currentColor`, so colour comes from the surrounding text.
 *
 * Accessibility: an icon is decorative by default (`aria-hidden`). Pass `label`
 * only when the icon carries meaning on its own — the wrapper then exposes
 * `role="img"` and an accessible name.
 */

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'ref'> {
  /** Pixel size for both dimensions. Defaults to 20. */
  size?: number;
  /** Accessible name. Omit for decorative icons. */
  label?: string;
}

function Svg({ size = 20, label, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={label === undefined ? true : undefined}
      role={label === undefined ? undefined : 'img'}
      aria-label={label}
      {...rest}
    >
      {children}
    </svg>
  );
}

/* -------------------------------------------------------------- navigation */

export function MenuIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 4h6v6M20 4l-8 8" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ status */

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12.5l5.5 5.5L20 6" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.2l2.6 2.6L16 9.5" />
    </Svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.75h.01" strokeWidth="2.2" />
    </Svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5L21.5 20h-19L12 3.5z" />
      <path d="M12 9.5v4.5" />
      <path d="M12 17.25h.01" strokeWidth="2.2" />
    </Svg>
  );
}

export function XCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </Svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 20.2s-7.2-4.4-7.2-9.3A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.7c0 4.9-7.2 9.3-7.2 9.3z" />
    </Svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 4.5c0 8.8-5.4 13-11.8 13.6" />
      <path d="M8.5 18c0-4.4 3-8.2 8.8-10.2" />
      <path d="M4 20c1.4-2 3.4-3.5 5.8-4.4" />
    </Svg>
  );
}

export function LoaderIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </Svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 15.5l-5-5-9 9" />
    </Svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7.5 3.5h-2a2 2 0 0 0-2 2v1.2C3.5 13.2 10.8 20.5 17.3 20.5h1.2a2 2 0 0 0 2-2v-2l-4-1.5-2 2a12.6 12.6 0 0 1-6-6l2-2-1.5-4z" />
    </Svg>
  );
}

/* ------------------------------------------------------------------- admin */

export function DashboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
    </Svg>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 3.5h7.5L18.5 8v12.5h-12.5z" />
      <path d="M13.5 3.5V8h5" />
      <path d="M9 12.5h6M9 16h6" />
    </Svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  );
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.5v3.5a1 1 0 0 0 1 1h2l10 4.5V5L7 9.5H5a1 1 0 0 0-1 1z" />
      <path d="M8 15.5V20h3v-3.2" />
    </Svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5a5.8 5.8 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M16 19.5a4.8 4.8 0 0 1 4.5-4.4" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 7.8l1.9 1.1M17.2 15.1l1.9 1.1M4.9 16.2l1.9-1.1M17.2 8.9l1.9-1.1" />
    </Svg>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 8.5h3l1.5-2h8l1.5 2h3v11h-17z" />
      <circle cx="12" cy="13.5" r="3.2" />
    </Svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 13.5h4l1.5 2.5h6l1.5-2.5h4" />
      <path d="M3.5 13.5V19h17v-5.5" />
      <path d="M5.5 4.5h13l2 9h-17z" />
    </Svg>
  );
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5.5 3.5h13V20l-2.2-1.5L14 20l-2-1.5L10 20l-2.3-1.5L5.5 20z" />
      <path d="M9 8h6M9 12h6" />
    </Svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 5.5h17l-6.5 7.5V20l-4 1.5v-8.5z" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 4.5H5.5v15H9" />
      <path d="M14 8l4 4-4 4M18 12H9.5" />
    </Svg>
  );
}

/* ------------------------------------------------------------------ social */

export function InstagramIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M16.9 7.2h.01" strokeWidth="2.4" />
    </Svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="4" />
      <path d="M10.6 9.6l4.8 2.4-4.8 2.4z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4.5l14 15M19 4.5l-14 15" />
    </Svg>
  );
}
