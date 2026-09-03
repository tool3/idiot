export const QUOTE =
  'a4.2 4.2 0 1 1 8.4 0 q0 5.4 -6.2 8.4 l-1.9 -3.1 q3.1 -1.6 3.6 -3.7 a4.2 4.2 0 0 1 -3.9 -1.6 z';

const tile = (from: string, to: string, glyph: string) =>
  [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
    `<defs><linearGradient id="t" x1="0" y1="0" x2="1" y2="1">`,
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>`,
    '</linearGradient></defs>',
    '<rect width="32" height="32" rx="7.4" fill="url(#t)"/>',
    `<path d="M7.1 13.4 ${QUOTE}" fill="${glyph}"/>`,
    `<path d="M16.6 13.4 ${QUOTE}" fill="${glyph}" opacity="0.55"/>`,
    '</svg>',
  ].join('');

const linkElement = (): HTMLLinkElement => {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (existing) return existing;
  const created = document.createElement('link');
  created.rel = 'icon';
  document.head.append(created);
  return created;
};

export const paintFavicon = () => {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  const svg = tile(read('--mark-from'), read('--mark-to'), read('--on-accent'));
  linkElement().href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
