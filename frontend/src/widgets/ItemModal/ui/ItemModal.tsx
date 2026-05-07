import type { ItemDetails } from '../../../entities/item/model/types';
import { formatStats } from '../../ItemTooltip';
import { getRarityColor } from '../../../entities/item/lib/getRarityColor';
import { getItemIconUrl } from '../../../entities/item/lib/getItemIconUrl';
import { getItemTypeRu } from '../lib/getTypeRu';
import { formatCoin } from '../../PriceBadge/lib/formatCoin';
import { useEffect, useCallback } from 'react';

interface SlotInfo {
  slot: string;
  stats?: Record<string, number>;
  infusions?: { id: number }[];
  upgrades?: { id: number }[];
}

interface ItemModalProps {
  item: ItemDetails;
  slot?: SlotInfo;
  onClose: () => void;
}

const FLAGS_RU: Record<string, string> = {
  'AccountBound': 'Привязано к аккаунту',
  'AccountBindOnUse': 'Привязывается при использовании',
  'Soulbound': 'Привязано к персонажу',
  'SoulbindOnUse': 'Привязывается при надевании',
  'Unique': 'Уникальное',
  'NotSellable': 'Не продаётся',
  'NoSell': 'Не продаётся',
  'HideSuffix': 'Скрывать суффикс',
  'MonsterOnly': 'Только для монстров',
  'Previewable': 'Можно предпросмотреть',
};

export function ItemModal({ item, slot, onClose }: ItemModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const rarityColor = getRarityColor(item.rarity);
  const iconUrl = getItemIconUrl(item.icon, 128);

  const stats = formatStats(slot?.stats);
  const hasStats = stats.length > 0;

  let flagsText = '';
  if (item.flags) {
    const knownFlags = item.flags
      .map((f) => FLAGS_RU[f])
      .filter(Boolean);
    if (knownFlags.length > 0) flagsText = knownFlags.join(', ');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-primary border border-border-primary rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <img
                src={iconUrl}
                alt={item.name}
                className="w-24 h-24 rounded-xl bg-bg-tertiary shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" fill="%236366f1"><rect width="96" height="96" rx="8"/><text x="48" y="52" text-anchor="middle" font-size="10" fill="white">GW2</text></svg>';
                }}
              />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-bold truncate" style={{ color: rarityColor }}>
                  {item.name}
                </h2>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-text-secondary mt-1">{getItemTypeRu(item.type)}</p>
              {item.level > 0 && (
                <p className="text-sm text-text-secondary">
                  Требуется уровень: <span className="text-indigo-400 font-medium">{item.level}</span>
                </p>
              )}
            </div>
          </div>

          {item.description && (
            <div className="mb-4 p-3 bg-bg-tertiary/50 rounded-xl">
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>
          )}

          {hasStats && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Характеристики</h3>
              <div className="flex flex-wrap gap-1.5">
                {stats.map((s) => (
                  <span
                    key={s.label}
                    className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-medium rounded-lg"
                  >
                    +{s.value} {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {item.rarity && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-text-secondary">Редкость:</span>
              <span className="text-sm font-medium" style={{ color: rarityColor }}>
                {item.rarity}
              </span>
            </div>
          )}

          {item.vendor_value != null && item.vendor_value > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-text-secondary">Продажа торговцу:</span>
              <span className="text-sm font-medium text-yellow-400">{formatCoin(item.vendor_value)}</span>
            </div>
          )}

          {flagsText && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-text-secondary">Свойства:</span>
              <span className="text-sm text-text-primary">{flagsText}</span>
            </div>
          )}

          {item.chat_link && (
            <div className="pt-3 border-t border-border-primary">
              <p className="text-xs text-text-secondary font-mono select-all">{item.chat_link}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}