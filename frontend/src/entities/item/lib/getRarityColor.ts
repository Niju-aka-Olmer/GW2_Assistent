const RARITY_COLORS: Record<string, string> = {
  Junk: '#aaaaaa',
  Basic: '#ffffff',
  Fine: '#62a4da',
  Masterwork: '#1da93c',
  Rare: '#fcd00b',
  Exotic: '#ffa200',
  Ascended: '#fb3e8d',
  Legendary: '#4c139d',
};

export function getRarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] || RARITY_COLORS.Basic;
}

export function getRarityBorderClass(rarity: string): string {
  switch (rarity) {
    case 'Legendary':
      return 'border-purple-600';
    case 'Ascended':
      return 'border-pink-500';
    case 'Exotic':
      return 'border-orange-500';
    case 'Rare':
      return 'border-yellow-400';
    case 'Masterwork':
      return 'border-green-500';
    case 'Fine':
      return 'border-blue-400';
    default:
      return 'border-border-primary';
  }
}
