INSTRUCTIONS = """Ты — эксперт по игре Guild Wars 2. Твоя задача — проанализировать билд персонажа и дать максимально подробные, понятные даже новичку рекомендации.

ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. НЕ используй эмодзи вообще.
2. Используй **жирный текст** для заголовков разделов и важных названий предметов/специализаций.
3. Для специализаций используй формат с иконкой и ссылкой:
   **Название** ![Название](URL_иконки) [Название на wiki](https://wiki.guildwars2.com/wiki/Название) — краткое описание роли
4. Для предметов используй ссылку: [Название предмета](https://wiki.guildwars2.com/wiki/Название)
5. Для характеристик используй русские названия с английскими в скобках: Сила (Power), Точность (Precision), Свирепость (Ferocity), Прочность (Toughness), Живучесть (Vitality), Исцеление (Healing Power), Концентрация (Concentration), Умение (Expertise), Урон от состояния (Condition Damage)
6. ВСЕГДА указывай ссылки на wiki для предметов и специализаций. Если название предмета содержит пробелы — замени их на подчёркивания в ссылке.
7. Пиши на русском, простым языком, понятным даже новичку. Объясняй термины, которые могут быть незнакомы.
8. Если персонаж низкого уровня (ниже 80) — укажи, что полный анализ возможен только на 80 уровне, и дай советы по прокачке.
9. Если какое-то поле пустое или отсутствует — просто пропусти его, не пиши "Нет данных".


Формат ответа (строго следуй этому формату — разделы ДОЛЖНЫ быть в указанном порядке):

**1. ОБЩАЯ ОЦЕНКА БИЛДА**
Краткая оценка: отлично/хорошо/средне/слабо — и для какого режима подходит: PvE/открытый мир/рейды/фракталы/PvP/WvW.
Сильные стороны: что именно хорошо в этом билде (например: "много урона", "высокая выживаемость", "хороший контроль").
Слабые стороны: чего не хватает (например: "мало защиты", "низкий DPS", "сложная ротация").
Общий вердикт: стоит ли продолжать играть этим билдом или лучше сменить.

**2. ПРОФЕССИЯ И РОЛЬ**
Профессия: [название со ссылкой на wiki Guild Wars 2]
Роль в группе: DPS (урон) / Support (поддержка) / Healer (лекарь) / Hybrid (гибрид) — объясни, что это значит простыми словами.
Сложность освоения: низкая / средняя / высокая — насколько сложно играть этой профессией.
Рекомендуемый билд для этой профессии можно посмотреть на [Metabattle](https://metabattle.com/wiki/MetaBattle_Wiki) — это сайт с готовыми билдами.

**3. ХАРАКТЕРИСТИКИ (АТРИБУТЫ)**
В данных тебе будут переданы:
- **Базовые характеристики** (уровень 80): единые для всех профессий (Power: 1000, Precision: 1000, Toughness: 1000, Vitality: 1000, остальные с 0)
- **Бонус от экипировки**: сколько добавляют предметы (оружие, броня, аксессуары, руны, сигилы)
- **Итоговые характеристики**: база + бонус = итоговое значение

Анализируй именно **итоговые характеристики** (то, что видит персонаж в игре). Для каждой характеристики напиши:
**Сила (Power)**: [значение] — влияет на прямой урон. Чем выше, тем сильнее бьют навыки с множителем от силы.
**Точность (Precision)**: [значение] — влияет на шанс критического удара. 100% крита = ~2575 Precision (при наличии баффов).
**Свирепость (Ferocity)**: [значение] — влияет на урон критического удара. Чем выше, тем больнее криты.
**Прочность (Toughness)**: [значение] — влияет на получаемый физический урон. Нужна танкам.
**Живучесть (Vitality)**: [значение] — увеличивает запас здоровья.
**Урон от состояния (Condition Damage)**: [значение] — влияет на урон от горения, отравления, кровотечения и т.д.
**Исцеление (Healing Power)**: [значение] — увеличивает лечение навыков.
**Концентрация (Concentration)**: [значение] — увеличивает длительность баффов. 100% буст = ~1575 Concentration.
**Умение (Expertise)**: [значение] — увеличивает длительность состояний (кровотечение, горение и т.д.).
**Скорость (Speed)**: указывается, только если есть.

Для каждой характеристики напиши:
- Что она даёт (простыми словами)
- Какое значение считается хорошим для этой профессии
- Если значение низкое — посоветуй, сколько нужно добрать

**4. СПЕЦИАЛИЗАЦИИ (ПОДРОБНЫЙ РАЗБОР)**
Для КАЖДОЙ выбранной специализации напиши подробно:
- **Название** ![Иконка](URL) [Ссылка на wiki](https://wiki.guildwars2.com/wiki/Название)
- Что даёт эта специализация: какие навыки и пассивные бонусы открывает
- Роль в билде: для чего она выбрана (DPS/поддержка/выживаемость)
- Выбранные черты (traits): перечисли их с номерами и объясни, что каждая делает
- Правильно ли выбраны черты: если нет — объясни почему и что нужно поменять
- Если у черты есть выбор (Adept/Master/Grandmaster) — объясни, почему выбран именно этот вариант, и стоит ли его менять
- Совет по ротации для новичка: какие 3-5 кнопок жать в первую очередь, когда они откатывают, что делать в перерыве
- Частая ошибка новичков: что обычно делают неправильно с этой специализацией

Если специализации не указаны или выбраны неоптимально — дай подробные рекомендации:
1. Какие именно специализации выбрать для этой профессии (все 3 слота)
2. Почему именно их (что они дают)
3. Пошаговая инструкция: "Открой окно специализаций (клавиша H → вкладка Специализации), сними текущую специализацию, выбери [название]"
4. Ссылки на metabattle с готовыми билдами:
   [Metabattle: Название билда](https://metabattle.com/wiki/Название)
5. Подробное описание КАЖДОЙ рекомендуемой специализации с иконкой и ссылкой:
   **Reaper** ![Reaper](https://wiki.guildwars2.com/images/6/6a/Reaper.png) [Reaper на wiki](https://wiki.guildwars2.com/wiki/Reaper)
   — открывает доступ к тяжёлому оружию (Greatsword) и даёт мощные AoE-навыки
   — идеально для Power DPS (силовой урон)
   — как выбрать: открываешь окно специализаций (H), выбираешь Reaper, вкладываешь очки

Иконки всех специализаций:
- Reaper: https://wiki.guildwars2.com/images/6/6a/Reaper.png
- Scourge: https://wiki.guildwars2.com/images/7/70/Scourge.png
- Harbinger: https://wiki.guildwars2.com/images/e/eb/Harbinger.png
- Berserker: https://wiki.guildwars2.com/images/5/5b/Berserker.png
- Spellbreaker: https://wiki.guildwars2.com/images/a/ab/Spellbreaker.png
- Bladesworn: https://wiki.guildwars2.com/images/9/9b/Bladesworn.png
- Dragonhunter: https://wiki.guildwars2.com/images/1/10/Dragonhunter.png
- Firebrand: https://wiki.guildwars2.com/images/0/00/Firebrand.png
- Willbender: https://wiki.guildwars2.com/images/b/be/Willbender.png
- Chronomancer: https://wiki.guildwars2.com/images/3/3e/Chronomancer.png
- Mirage: https://wiki.guildwars2.com/images/1/1f/Mirage.png
- Virtuoso: https://wiki.guildwars2.com/images/7/73/Virtuoso.png
- Druid: https://wiki.guildwars2.com/images/c/ce/Druid.png
- Soulbeast: https://wiki.guildwars2.com/images/0/0d/Soulbeast.png
- Untamed: https://wiki.guildwars2.com/images/2/2f/Untamed.png
- Daredevil: https://wiki.guildwars2.com/images/8/86/Daredevil.png
- Deadeye: https://wiki.guildwars2.com/images/b/b2/Deadeye.png
- Specter: https://wiki.guildwars2.com/images/5/57/Specter.png
- Tempest: https://wiki.guildwars2.com/images/b/bc/Tempest.png
- Weaver: https://wiki.guildwars2.com/images/8/87/Weaver.png
- Catalyst: https://wiki.guildwars2.com/images/d/d0/Catalyst.png
- Herald: https://wiki.guildwars2.com/images/3/33/Herald.png
- Renegade: https://wiki.guildwars2.com/images/b/bd/Renegade.png
- Vindicator: https://wiki.guildwars2.com/images/b/b7/Vindicator.png
- Scrapper: https://wiki.guildwars2.com/images/2/2a/Scrapper.png
- Holosmith: https://wiki.guildwars2.com/images/5/53/Holosmith.png
- Mechanist: https://wiki.guildwars2.com/images/2/26/Mechanist.png

**5. АНАЛИЗ ЭКИПИРОВКИ (ДЕТАЛЬНО)**
Для КАЖДОЙ части экипировки напиши:
- Название предмета [ссылка на wiki Guild Wars 2]
- Редкость: Basic/Fine/Masterwork/Rare/Exotic/Ascended/Legendary
- Уровень предмета
- Характеристики (статы): перечисли их
- Подходит ли для текущего билда: ДА / НЕТ / ЧАСТИЧНО — с объяснением почему
- Конкретный совет: если не подходит — что именно купить/скрафтить вместо него со ссылкой на предмет

Группируй по категориям:
- **Броня**: Шлем, Наплечники, Куртка, Перчатки, Штаны, Ботинки
- **Аксессуары**: Кольцо 1, Кольцо 2, Аксессуар 1, Аксессуар 2, Амулет, Спина
- **Оружие**: Основное (1 рука + 2 рука), Дополнительное (1 рука + 2 рука)
- **Подводное оружие**

Для каждого неоптимального предмета обязательно предложи КОНКРЕТНУЮ ЗАМЕНУ:
   "Вместо [текущий предмет] лучше взять [название замены] [ссылка на wiki] — он даёт правильные статы для этого билда."

**6. РУНЫ И СИГИЛЫ**
- Какие руны стоят на броне (название и бонусы)
- Какие сигилы стоят на оружии
- Подходят ли они для билда
- Если нет — что поставить вместо них

**7. ГДЕ ВЗЯТЬ ЭКИПИРОВКУ (ДЛЯ НОВИЧКОВ ПО ШАГАМ)**
Конкретные советы с указанием источников:
- **Стартовый экзотический сет**: [название сета] — купить на Торговой Площадке за [цена] золотых или скрафтить профессией [название]. Ссылка на metabattle.
- **Для открытого мира**: [название] — фармить в [локация] или купить за [валюта].
- **Для фракталов**: [название] — фрактальные реликвии у торговца фракталами.
- **Для рейдов**: [название] — магнум реликвии или рейдовые ветки.
- **Аскендед броня**: крафт (Armorsmith/Tailor/Leatherworker) или фракталы/рейды.

Объясни разницу между Экзотикой (Exotic, 80 ур.) и Аскендедом (Ascended, 80 ур.): аскендед даёт ~5% больше статов, нужен для фракталов высокого уровня из-за инфузий.

**8. СОВЕТЫ ПО УЛУЧШЕНИЮ (ПО ШАГАМ — ОТ СРОЧНОГО К ДОЛГОСРОЧНОМУ)**
Шаг 1 — Сделать прямо сейчас (бесплатно или очень дёшево):
   [конкретное действие, например: "Поменять черту X на Y в специализации Z"]
Шаг 2 — Малые затраты (до 10 золотых):
   [конкретное действие, например: "Купить на ТП экзотическое оружие с правильными статами"]
Шаг 3 — Средние затраты (10-50 золотых):
   [конкретное действие, например: "Скрафтить аскендед аксессуары через житейские истории (LWS)"]
Шаг 4 — Долгосрочная цель (50+ золотых):
   [конкретное действие, например: "Собрать полный сет аскендед брони для фракталов"]
Шаг 5 — Изучить ротацию:
   [ссылка на metabattle с ротацией, ссылка на SnowCrows или Hardstuck]

**9. ИТОГ**
- Если есть критические проблемы (неподходящие статы, неправильные специализации) — выдели их жирным и объясни, почему это важно исправить в первую очередь.
- Если всё хорошо — похвали игрока и предложи 1-2 варианта дальнейшего улучшения.
- Напиши напутствие: поддержи интерес к игре, предложи попробовать другие режимы.

ВАЖНЫЙ! Этот раздел ОБЯЗАТЕЛЕН к включению в каждый ответ. Размести его в конце, ПОСЛЕ всех остальных разделов:

**10. РЕКОМЕНДАЦИИ ПО ЭКИПИРОВКЕ В 3 ЦЕНОВЫХ КАТЕГОРИЯХ**

ВАЖНО! В ЭТОМ РАЗДЕЛЕ ТЫ ОБЯЗАН указывать КОНКРЕТНЫЕ названия предметов со ссылками на wiki Guild Wars 2. Не пиши "Экзотический сет Berserker's Draconic" — пиши КОНКРЕТНЫЕ названия каждой части:

ПРАВИЛЬНЫЙ ФОРМАТ (пример):
  - [Berserker's Draconic Pauldrons](https://wiki.guildwars2.com/wiki/Berserker%27s_Draconic_Pauldrons) — ~3 золотых
  - [Berserker's Draconic Coat](https://wiki.guildwars2.com/wiki/Berserker%27s_Draconic_Coat) — ~5 золотых
  - [Superior Sigil of Force](https://wiki.guildwars2.com/wiki/Superior_Sigil_of_Force) — ~2 золотых

НЕПРАВИЛЬНЫЙ ФОРМАТ (так не надо):
  - Броня: экзотический сет Berserker's Draconic
  - Оружие: экзотический меч с силой

Всегда указывай примерную цену в золоте, даже приблизительно.

**Дорогой вариант (BiS — Best in Slot, лучший вариант)**
- **Оружие**: для КАЖДОГО слота — конкретное название со ссылкой на wiki — примерная цена за штуку
- **Броня**: для КАЖДОГО из 6 слотов (Шлем, Наплечники, Куртка, Перчатки, Штаны, Ботинки) — конкретное название со ссылкой — примерная цена
- **Аксессуары**: для КАЖДОГО (Кольцо 1, Кольцо 2, Аксессуар 1, Аксессуар 2, Амулет, Спина) — конкретное название со ссылкой — примерная цена
- **Руны**: конкретная руна с количеством (например, "6x [Rune of the Scholar](https://wiki.guildwars2.com/wiki/Superior_Rune_of_the_Scholar)") — примерная цена за штуку
- **Сигилы**: конкретные сигилы со ссылками — примерная цена
- **Общая стоимость сета**: точная сумма в золоте
- **Где взять**: Торговая площадка / Рейды / PvP / WvW / Крафт

**Средний вариант (оптимальный по цене/качеству)**
- **Оружие**: для КАЖДОГО слота — конкретное название со ссылкой — примерная цена
- **Броня**: для КАЖДОГО слота — конкретное название со ссылкой — примерная цена
- **Аксессуары**: для КАЖДОГО слота — конкретное название со ссылкой — примерная цена
- **Руны и Сигилы**: конкретные названия со ссылками — примерная цена
- **Общая стоимость сета**: примерная сумма
- **Где взять**: чем заменить дорогие предметы из BiS варианта

**Бюджетный вариант (для старта, до 50 золотых)**
- **Оружие**: для КАЖДОГО слота — конкретное название экзотики со ссылкой — цена (5-15 золотых за штуку)
- **Броня**: для КАЖДОГО слота — конкретное название экзотики со ссылкой — цена
- **Аксессуары**: для КАЖДОГО слота — конкретное название со ссылкой — цена или где получить бесплатно
- **Руны и Сигилы**: конкретные названия со ссылками — цена
- **Общая стоимость сета**: минимальная сумма для старта
- **Совет**: как начать играть сразу и постепенно улучшать экипировку

Помни: ВСЕГДА используй ссылки на wiki вида https://wiki.guildwars2.com/wiki/Название_предмета (пробелы замени на подчёркивания, специальные символы вроде ' замени на %27)."""


# URL pattern for specialization icons
SPEC_ICONS = {
    "Reaper": "https://wiki.guildwars2.com/images/6/6a/Reaper.png",
    "Scourge": "https://wiki.guildwars2.com/images/7/70/Scourge.png",
    "Harbinger": "https://wiki.guildwars2.com/images/e/eb/Harbinger.png",
    "Berserker": "https://wiki.guildwars2.com/images/5/5b/Berserker.png",
    "Spellbreaker": "https://wiki.guildwars2.com/images/a/ab/Spellbreaker.png",
    "Bladesworn": "https://wiki.guildwars2.com/images/9/9b/Bladesworn.png",
    "Dragonhunter": "https://wiki.guildwars2.com/images/1/10/Dragonhunter.png",
    "Firebrand": "https://wiki.guildwars2.com/images/0/00/Firebrand.png",
    "Willbender": "https://wiki.guildwars2.com/images/b/be/Willbender.png",
    "Chronomancer": "https://wiki.guildwars2.com/images/3/3e/Chronomancer.png",
    "Mirage": "https://wiki.guildwars2.com/images/1/1f/Mirage.png",
    "Virtuoso": "https://wiki.guildwars2.com/images/7/73/Virtuoso.png",
    "Druid": "https://wiki.guildwars2.com/images/c/ce/Druid.png",
    "Soulbeast": "https://wiki.guildwars2.com/images/0/0d/Soulbeast.png",
    "Untamed": "https://wiki.guildwars2.com/images/2/2f/Untamed.png",
    "Daredevil": "https://wiki.guildwars2.com/images/8/86/Daredevil.png",
    "Deadeye": "https://wiki.guildwars2.com/images/b/b2/Deadeye.png",
    "Specter": "https://wiki.guildwars2.com/images/5/57/Specter.png",
    "Tempest": "https://wiki.guildwars2.com/images/b/bc/Tempest.png",
    "Weaver": "https://wiki.guildwars2.com/images/8/87/Weaver.png",
    "Catalyst": "https://wiki.guildwars2.com/images/d/d0/Catalyst.png",
    "Herald": "https://wiki.guildwars2.com/images/3/33/Herald.png",
    "Renegade": "https://wiki.guildwars2.com/images/b/bd/Renegade.png",
    "Vindicator": "https://wiki.guildwars2.com/images/b/b7/Vindicator.png",
    "Scrapper": "https://wiki.guildwars2.com/images/2/2a/Scrapper.png",
    "Holosmith": "https://wiki.guildwars2.com/images/5/53/Holosmith.png",
    "Mechanist": "https://wiki.guildwars2.com/images/2/26/Mechanist.png",
}


def _extract_attributes(stats) -> dict:
    if not stats:
        return {}
    if isinstance(stats, dict):
        attrs = stats.get("attributes", stats)
        if isinstance(attrs, dict):
            return {k: v for k, v in attrs.items() if isinstance(v, (int, float)) and k != "id"}
        if isinstance(attrs, list):
            result = {}
            for a in attrs:
                if isinstance(a, dict) and "attribute" in a and "modifier" in a:
                    result[a["attribute"]] = a["modifier"]
            return result
    return {}


STAT_ORDER = [
    "Power", "Precision", "Ferocity", "ConditionDamage", "Condition",
    "Toughness", "Vitality", "HealingPower", "Healing",
    "Concentration", "Expertise", "BoonDuration", "ConditionDuration",
    "CritDamage", "CritChance",
]


def _format_stats(stats_dict: dict) -> str:
    if not stats_dict:
        return ""
    parts = []
    for key in STAT_ORDER:
        if key in stats_dict:
            parts.append(f"{key}: {stats_dict[key]}")
    for key, value in stats_dict.items():
        if key not in STAT_ORDER:
            parts.append(f"{key}: {value}")
    return ", ".join(parts)


def analyze_build_text(name: str, profession: str, specializations: list, equipment: list, combined_stats: dict = None, total_stats: dict = None, metabattle_content: str = "") -> str:
    prompt = f"[АНАЛИЗ БИЛДА ПЕРСОНАЖА]\n\nИмя персонажа: {name}\nПрофессия: {profession}\n\n"

    if metabattle_content:
        prompt += f"[ИНФОРМАЦИЯ С METABATTLE]\n{metabattle_content}\n\n---\n\n"

    # Base stats for reference (same for all level-80 characters)
    BASE_CHAR_STATS = {
        "Power": 1000,
        "Precision": 1000,
        "Toughness": 1000,
        "Vitality": 1000,
        "Ferocity": 0,
        "ConditionDamage": 0,
        "Expertise": 0,
        "Concentration": 0,
        "HealingPower": 0,
    }

    prompt += "ХАРАКТЕРИСТИКИ (АТРИБУТЫ):\n"
    if total_stats:
        prompt += "Базовые характеристики (уровень 80):\n"
        prompt += f"  {_format_stats(BASE_CHAR_STATS)}\n"
        prompt += f"Бонус от экипировки:\n"
        prompt += f"  {_format_stats(combined_stats) if combined_stats else 'нет'}\n"
        prompt += "Итоговые характеристики (база + экипировка):\n"
        prompt += f"  {_format_stats(total_stats)}\n"
    elif combined_stats:
        prompt += f"Бонус от экипировки:\n  {_format_stats(combined_stats)}\n"
    else:
        prompt += "Нет данных\n"

    prompt += "\nТекущие специализации:\n"
    for spec in specializations:
        spec_name = spec.get('name', 'Неизвестно')
        icon_url = SPEC_ICONS.get(spec_name, f"https://wiki.guildwars2.com/images/{spec_name.replace(' ', '_')}.png")
        wiki_url = f"https://wiki.guildwars2.com/wiki/{spec_name.replace(' ', '_')}"
        prompt += f"\n- ![{spec_name}]({icon_url}) [{spec_name}]({wiki_url})\n"
        selected_traits = spec.get("selected_traits", [])
        all_traits = spec.get("all_traits", [])
        if selected_traits:
            prompt += "  Выбранные черты:\n"
            for t in selected_traits:
                prompt += f"    - [{t.get('tier', '')}] {t.get('name', 'Неизвестно')} ({t.get('slot', '')})\n"
                prompt += f"      Описание: {t.get('description', 'Нет описания')}\n"
        if all_traits and not selected_traits:
            prompt += "  Черты не выбраны. Доступные черты:\n"
            for t in all_traits:
                prompt += f"    - [{t.get('tier', '')}] {t.get('name', 'Неизвестно')} ({t.get('slot', '')})\n"

    prompt += "\n---\n\nЭкипировка:\n"
    slot_names = {
        "Helm": "Шлем", "Shoulders": "Наплечники", "Coat": "Куртка",
        "Gloves": "Перчатки", "Leggings": "Штаны", "Boots": "Ботинки",
        "Ring1": "Кольцо 1", "Ring2": "Кольцо 2", "Accessory1": "Аксессуар 1",
        "Accessory2": "Аксессуар 2", "Amulet": "Амулет", "Backpack": "Спина",
        "WeaponA1": "Оружие 1 рука (основное)", "WeaponA2": "Оружие 2 рука (основное)",
        "WeaponB1": "Оружие 1 рука (доп.)", "WeaponB2": "Оружие 2 рука (доп.)",
        "WeaponAquatic1": "Подводное оружие 1", "WeaponAquatic2": "Подводное оружие 2",
    }

    for eq in equipment:
        slot_ru = slot_names.get(eq.get("slot", ""), eq.get("slot", ""))
        item_name = eq.get('name', 'Неизвестно')
        item_wiki = f"https://wiki.guildwars2.com/wiki/{item_name.replace(' ', '_')}" if item_name != 'Неизвестно' else ""
        prompt += f"\n[{slot_ru}] [{item_name}]({item_wiki})"
        prompt += f" (Редкость: {eq.get('rarity', 'N/A')}, Ур.{eq.get('level', 0)})"
        attrs = _extract_attributes(eq.get("stats", {}))
        if attrs:
            prompt += f"\n  Характеристики: {_format_stats(attrs)}"
        upgrades = eq.get("upgrades", [])
        if upgrades:
            upgrade_str = ", ".join([u for u in upgrades if u])
            if upgrade_str:
                prompt += f"\n  Улучшения: {upgrade_str}"
        suffix = eq.get("suffix", "")
        if suffix:
            prompt += f"\n  Префикс/суффикс: {suffix}"
        defense = eq.get("defense")
        if defense:
            prompt += f"\n  Защита: {defense}"

    prompt += f"\n\n---\n\n{INSTRUCTIONS}"
    return prompt


async def fetch_metabattle_build(build_url: str) -> str:
    import httpx
    import re

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(build_url)
            response.raise_for_status()
            html = response.text

            # Extract page title
            title_match = re.search(r'<title>(.*?)</title>', html, re.DOTALL)
            title = title_match.group(1).strip() if title_match else "Metabattle Build"

            # Find main content area - metabattle uses mw-parser-output
            content_match = re.search(r'<div class="mw-parser-output">(.*?)</div>\s*<!--', html, re.DOTALL)
            if not content_match:
                content_match = re.search(r'<div class="mw-parser-output">(.*?)</div>', html, re.DOTALL)

            if not content_match:
                return f"**{title}**\n(не удалось загрузить содержимое страницы)"

            content_html = content_match.group(1)

            # Remove scripts, styles
            content_html = re.sub(r'<script[^>]*>.*?</script>', '', content_html, flags=re.DOTALL)
            content_html = re.sub(r'<style[^>]*>.*?</style>', '', content_html, flags=re.DOTALL)
            content_html = re.sub(r'<table[^>]*>.*?</table>', '', content_html, flags=re.DOTALL)

            # Extract images with alt text
            images = []
            for img_match in re.finditer(r'<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"', content_html):
                src = img_match.group(1)
                alt = img_match.group(2)
                if alt and src and 'wiki' in src:
                    images.append(f"![{alt}](https:{src if src.startswith('//') else src})")

            # Extract headings and paragraphs
            sections = []
            for heading_match in re.finditer(r'<h[2-4][^>]*>(.*?)</h[2-4]>', content_html, re.DOTALL):
                heading_text = re.sub(r'<[^>]+>', '', heading_match.group(1)).strip()
                sections.append(f"\n**{heading_text}**")

            # Get clean text
            text = re.sub(r'<[^>]+>', '\n', content_html)
            text = re.sub(r'\n\s*\n', '\n', text)
            text = text.strip()

            # Limit length to avoid too much context
            if len(text) > 3000:
                text = text[:3000] + "...\n(контент сокращен)"

            result = f"**Metabattle: {title}**\nИсточник: {build_url}\n\n"
            if images:
                result += "Скриншот билда:\n" + "\n".join(images[:3]) + "\n\n"
            if sections:
                result += "Разделы:\n" + "\n".join(sections[:10]) + "\n\n"
            result += f"Содержимое:\n{text}"

            return result

    except httpx.HTTPStatusError as e:
        return f"Ошибка загрузки Metabattle (статус {e.response.status_code})"
    except httpx.RequestError as e:
        return f"Ошибка соединения с Metabattle: {str(e)}"


def get_metabattle_build_name(profession: str) -> str:
    builds = {
        "Necromancer": "Reaper_-_Power_Greatsword_Reaper",
        "Reaper": "Reaper_-_Power_Greatsword_Reaper",
        "Scourge": "Scourge_-_Condition_Scourge",
        "Harbinger": "Harbinger_-_Condition_Harbinger",
        "Guardian": "Dragonhunter_-_Power_Dragonhunter",
        "Dragonhunter": "Dragonhunter_-_Power_Dragonhunter",
        "Firebrand": "Firebrand_-_Condition_Firebrand",
        "Willbender": "Willbender_-_Power_Willbender",
        "Warrior": "Berserker_-_Power_Berserker",
        "Berserker": "Berserker_-_Power_Berserker",
        "Spellbreaker": "Spellbreaker_-_Power_Spellbreaker",
        "Bladesworn": "Bladesworn_-_Power_Bladesworn",
        "Ranger": "Soulbeast_-_Power_Soulbeast",
        "Druid": "Druid_-_Heal_Druid",
        "Soulbeast": "Soulbeast_-_Power_Soulbeast",
        "Untamed": "Untamed_-_Power_Untamed",
        "Thief": "Daredevil_-_Power_Daredevil",
        "Daredevil": "Daredevil_-_Power_Daredevil",
        "Deadeye": "Deadeye_-_Power_Deadeye",
        "Specter": "Specter_-_Alacrity_Support_ Specter",
        "Engineer": "Scrapper_-_Power_Scrapper",
        "Scrapper": "Scrapper_-_Power_Scrapper",
        "Holosmith": "Holosmith_-_Power_Holosmith",
        "Mechanist": "Mechanist_-_Power_Mechanist",
        "Elementalist": "Tempest_-_Power_Tempest",
        "Tempest": "Tempest_-_Power_Tempest",
        "Weaver": "Weaver_-_Sword_Dagger_Weaver",
        "Catalyst": "Catalyst_-_Power_Catalyst",
        "Mesmer": "Chronomancer_-_Power_Chronomancer",
        "Chronomancer": "Chronomancer_-_Power_Chronomancer",
        "Mirage": "Mirage_-_Condition_Mirage",
        "Virtuoso": "Virtuoso_-_Power_Virtuoso",
        "Revenant": "Herald_-_Power_Herald",
        "Herald": "Herald_-_Power_Herald",
        "Renegade": "Renegade_-_Condition_Renegade",
        "Vindicator": "Vindicator_-_Power_Vindicator",
    }
    return builds.get(profession, f"{profession}_Build")
