// Offline-safe avatar generator using inline SVG data URIs

export function createInitialsAvatar(name: string, bgColor = '#102030', textColor = '#4edea3'): string {
  const parts = (name || 'Coach').trim().split(' ');
  const initials = parts.length >= 2 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : ((name || 'CR').slice(0, 2)).toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="${bgColor}" rx="64"/>
    <circle cx="64" cy="64" r="60" stroke="${textColor}" stroke-width="3" fill="none" opacity="0.4"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-family="Arial, sans-serif" font-weight="800" font-size="46">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createLogoAvatar(title = 'CRIC', bgColor = '#0d1322', accentColor = '#4edea3'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="${bgColor}" rx="24"/>
    <circle cx="64" cy="64" r="48" fill="none" stroke="${accentColor}" stroke-width="4"/>
    <path d="M 32 64 A 32 32 0 0 0 96 64" fill="none" stroke="${accentColor}" stroke-width="3" stroke-dasharray="6 4"/>
    <text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="${accentColor}" font-family="Arial, sans-serif" font-weight="900" font-size="28">${title}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
