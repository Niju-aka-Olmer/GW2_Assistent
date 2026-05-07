export function getItemIconUrl(icon: string, size: number = 32): string {
  if (!icon) return '';
  if (icon.startsWith('http')) return icon;
  return `https://render.guildwars2.com/file/${icon}${size > 0 ? `?size=${size}` : ''}`;
}
