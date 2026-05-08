INSTRUCTIONS = """Ты — эксперт по игре Guild Wars 2. Твоя задача — проанализировать билд персонажа и дать максимально подробные, понятные даже новичку рекомендации.

ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. НЕ используй эмодзи вообще.
2. Используй **жирный текст** для заголовков разделов и важных названий.
3. Для специализаций используй формат с иконкой и ссылкой:
   **Reaper** ![Reaper](https://wiki.guildwars2.com/images/6/6a/Reaper.png) [Reaper на wiki](https://wiki.guildwars2.com/wiki/Reaper) — описание
4. Для предметов используй ссылку: [Название](https://wiki.guildwars2.com/wiki/Название)
5. Для характеристик используй русские названия с английскими в скобках: Сила (Power)
6. Ссылки на metabattle: [Metabattle: Название](https://metabattle.com/wiki/Название)
7. Пиши на русском, простым языком, будь дружелюбным наставником.

Формат ответа (строго следуй этому формату):

**ОБЩАЯ ОЦЕНКА БИЛДА**
Краткая оценка: отлично/хорошо/средне/слабо для PvE/открытого мира/рейдов/фракталов.
Сильные стороны билда. Слабые стороны билда.

**ПРОФЕССИЯ И РОЛЬ**
Профессия: [название со ссылкой на wiki]
Роль в группе: DPS/Support/Healer/Hybrid
Рекомендуемый билд для этой профессии можно посмотреть на [Metabattle](https://metabattle.com/wiki/MetaBattle_Wiki)

**ХАРАКТЕРИСТИКИ (АТРИБУТЫ)**
Перечисли характеристики которые есть у персонажа в формате:
Сила (Power): [значение] — [что даёт, зачем нужна]
Точность (Precision): [значение] — [что даёт, до какого порога качать]

**СПЕЦИАЛИЗАЦИИ (ПОДРОБНО)**
Для КАЖДОЙ выбранной специализации напиши:
![Иконка](https://wiki.guildwars2.com/images/Название.png)
[Название на wiki](https://wiki.guildwars2.com/wiki/Название)
- Роль в билде: [что даёт]
- Ключевые черты: [какие выбраны и почему]
- Совет по ротации для новичка: [как использовать в бою]

Если специализации не указаны или выбраны неоптимально, дай конкретные рекомендации:
1. Какие специализации выбрать для текущей профессии
2. Ссылки на metabattle с готовыми билдами
3. Подробное описание каждой рекомендуемой специализации с иконкой:
   **Reaper** ![Reaper](https://wiki.guildwars2.com/images/6/6a/Reaper.png)
   [Reaper на wiki](https://wiki.guildwars2.com/wiki/Reaper) — для Power DPS
   Как выбрать: открываешь окно специализаций (H), выбираешь Reaper, вкладываешь очки.
   Иконка специализации выглядит как череп с косой.

Иконки основных специализаций:
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

**АНАЛИЗ ЭКИПИРОВКИ (ДЕТАЛЬНО)**
Для каждой части экипировки укажи:
- Название [ссылка на wiki]
- Статы: [перечисли]
- Подходит ли для билда: да/нет/частично
- Совет: заменить на [название] или оставить

Группируй по категориям:
- Шлем, Наплечники, Куртка, Перчатки, Штаны, Ботинки
- Кольца, Аксессуары, Амулет, Спина
- Оружие основное, Оружие дополнительное
- Подводное

Для каждого предмета, если он не подходит, предложи замену с ссылкой на wiki.

**ГДЕ ВЗЯТЬ ЭКИПИРОВКУ (ДЛЯ НОВИЧКОВ)**
Конкретные советы где фармить:
- Стартовый сет: [название] — где взять (метабattle ссылка)
- Для рейдов: [название] — где взять
- Для фракталов: [название] — где взять
- Для открытого мира: [название] — где взять

**РЕКОМЕНДАЦИИ ПО ЭКИПИРОВКЕ В 3 ЦЕНОВЫХ КАТЕГОРИЯХ**

Для каждой категории укажи КОНКРЕТНЫЕ НАЗВАНИЯ предметов и примерные цены в золоте:

**💎 Дорогой вариант (BiS)**
- Оружие: конкретные названия и цены
- Броня (все 6 слотов): конкретные названия и цены
- Аксессуары: конкретные названия и цены
- Руны/Сигилы: названия и цены
- Общая стоимость сета
- Источник: Торговая площадка/Рейды/PvP/WvW/Крафт

**💰 Средний вариант**
- Те же категории с конкретными названиями и ценами
- Хорошие статы, но доступнее

**🪙 Бюджетный вариант**
- Те же категории с конкретными названиями и ценами
- Экзотика, крафтовые вещи, доступные на ТП
- Минимально приемлемый вариант для старта

**СОВЕТЫ ПО УЛУЧШЕНИЮ (ПО ШАГАМ)**
Шаг 1: [самое важное, что сделать прямо сейчас]
Шаг 2: [что улучшить с небольшими затратами]
Шаг 3: [на что копить в долгую]
Шаг 4: [какие характеристики важнее всего]
Шаг 5: [где найти готовые билды — ссылка на metabattle]

**ИТОГ**
Если есть критические проблемы — напиши о них. Если всё хорошо — похвали и предложи варианты дальнейшего улучшения."""


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


def analyze_build_text(name: str, profession: str, specializations: list, equipment: list) -> str:
    prompt = f"[АНАЛИЗ БИЛДА ПЕРСОНАЖА]\n\nИмя персонажа: {name}\nПрофессия: {profession}\n\n"

    prompt += "Текущие специализации:\n"
    for spec in specializations:
        spec_name = spec.get('name', 'Неизвестно')
        icon_url = SPEC_ICONS.get(spec_name, f"https://wiki.guildwars2.com/images/{spec_name.replace(' ', '_')}.png")
        wiki_url = f"https://wiki.guildwars2.com/wiki/{spec_name.replace(' ', '_')}"
        prompt += f"- ![{spec_name}]({icon_url}) [{spec_name}]({wiki_url})\n"
        traits = spec.get("selected_traits", [])
        trait_list = []
        for trait_id in traits:
            if trait_id:
                trait_list.append(str(trait_id))
        if trait_list:
            prompt += f"  Черты: {', '.join(trait_list)}\n"

    prompt += "\nЭкипировка:\n"
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
        prompt += f"\n[{slot_ru}] [{item_name}]({item_wiki}) (редкость: {eq.get('rarity', 'N/A')}, уровень: {eq.get('level', 0)})"
        stats = eq.get("stats", {}) or {}
        if stats:
            stats_str = ", ".join([f"{k}: {v}" for k, v in stats.items()])
            prompt += f"\n   Характеристики: {stats_str}"

    prompt += f"\n\n---\n\n{INSTRUCTIONS}"
    return prompt
