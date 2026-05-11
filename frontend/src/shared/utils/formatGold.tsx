const COIN_ICONS = {
  gold: 'https://render.guildwars2.com/file/090A980A96D39FD36FBB004903644C6DBEFB1FFB/156904.png',
  silver: 'https://render.guildwars2.com/file/E5A2197D78ECE4AE0349C8B3710D033D22DB0DA6/156907.png',
  copper: 'https://render.guildwars2.com/file/6CF8F96A3299CFC75D5CC90617C3C70331A1EF0E/156902.png',
};

export function FormatGold({ value, className }: { value: number; className?: string }) {
  const abs = Math.abs(value);
  const g = Math.floor(abs / 10000);
  const remainder = abs % 10000;
  const s = Math.floor(remainder / 100);
  const c = remainder % 100;
  const sign = value < 0 ? '-' : '';

  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      {g > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <img src={COIN_ICONS.gold} alt="" className="inline-block w-4 h-4" />
          <span className="text-yellow-400">{sign}{g}</span>
        </span>
      )}
      {s > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <img src={COIN_ICONS.silver} alt="" className="inline-block w-4 h-4" />
          <span className="text-gray-300">{s}</span>
        </span>
      )}
      {c > 0 && (
        <span className="inline-flex items-center gap-0.5">
          <img src={COIN_ICONS.copper} alt="" className="inline-block w-4 h-4" />
          <span className="text-amber-600">{c}</span>
        </span>
      )}
      {g === 0 && s === 0 && c === 0 && (
        <span className="inline-flex items-center gap-0.5">
          <img src={COIN_ICONS.copper} alt="" className="inline-block w-4 h-4" />
          <span className="text-amber-600">0</span>
        </span>
      )}
    </span>
  );
}

export function formatGoldString(coins: number): string {
  const abs = Math.abs(coins);
  const g = Math.floor(abs / 10000);
  const s = Math.floor((abs % 10000) / 100);
  const c = abs % 100;
  if (g > 0) return `${g}з ${s}с ${c}м`;
  if (s > 0) return `${s}с ${c}м`;
  return `${c}м`;
}
