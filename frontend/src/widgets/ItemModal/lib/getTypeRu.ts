const TYPE_RU: Record<string, string> = {
  'Armor': 'Броня',
  'Weapon': 'Оружие',
  'Trinket': 'Аксессуар',
  'Back': 'Спина',
  'Bag': 'Сумка',
  'Consumable': 'Расходник',
  'Gathering': 'Инструмент',
  'Gizmo': 'Гизмо',
  'JadeTech': 'Джейд-технология',
  'Key': 'Ключ',
  'MiniPet': 'Мини-питомец',
  'Trophy': 'Трофей',
  'UpgradeComponent': 'Компонент улучшения',
  'CraftingMaterial': 'Материал ремесла',
  'Container': 'Контейнер',
  'Recipe': 'Рецепт',
};

export function getItemTypeRu(type: string): string {
  return TYPE_RU[type] || type;
}