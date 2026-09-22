type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AnchorIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="5" r="2.25" />
      <path d="M12 7.5V21" />
      <path d="M5 12h14" />
      <path d="M5 12c0 4 3 7.5 7 8.8" />
      <path d="M19 12c0 4-3 7.5-7 8.8" />
    </svg>
  );
}

export function BoatIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M3 15h18l-2.2 4.2a2 2 0 0 1-1.8 1.1H7a2 2 0 0 1-1.8-1.1L3 15Z" />
      <path d="M8 15V6a1 1 0 0 1 1-1h1v10" />
      <path d="M13 15V4l5 5-3 2" />
    </svg>
  );
}

export function ScheduleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <rect x="4" y="4.5" width="16" height="16" rx="2" />
      <path d="M4 9.5h16" />
      <path d="M8.5 3v3M15.5 3v3" />
      <path d="M8 13.5l2 2 4-4.2" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function WaveIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M2 8c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 14c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
      <path d="M2 20c1.5-2 3.5-2 5 0s3.5 2 5 0 3.5-2 5 0 3.5 2 5 0" />
    </svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.25" />
      <path d="M15.8 14.2c2.6.5 4.7 2.6 4.7 5.8" />
    </svg>
  );
}

export function CompassIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-2 6-4 2 2-6 4-2Z" />
    </svg>
  );
}

export function ExitIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
      <path d="M14 16l5-4-5-4" />
      <path d="M19 12H9" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.4" />
      <path d="M12 18.1v2.4" />
      <path d="M20.5 12h-2.4" />
      <path d="M5.9 12H3.5" />
      <path d="M17.7 6.3l-1.7 1.7" />
      <path d="M8 16l-1.7 1.7" />
      <path d="M17.7 17.7L16 16" />
      <path d="M8 8L6.3 6.3" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
