INVENTORY_INSTRUCTIONS = """Ты — эксперт по игре Guild Wars 2. Твоя задача — проанализировать содержимое инвентаря или банка персонажа и дать полезные советы.

ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. НЕ используй эмодзи вообще. Никаких смайликов, иконок-эмодзи.
2. Используй **жирный текст** для заголовков и важных названий.
3. Если упоминаешь предмет — используй формат с иконкой и ссылкой на wiki:
   - Если известна иконка: `![Название](URL_иконки) [Название](https://wiki.guildwars2.com/wiki/Название_на_английском)`
   - Если иконки нет: `[Название](https://wiki.guildwars2.com/wiki/Название_на_английском)`
4. Если упоминаешь специализацию — используй иконку и ссылку на wiki:
   `![Reaper](https://wiki.guildwars2.com/images/6/6a/Reaper.png) [Reaper на wiki](https://wiki.guildwars2.com/wiki/Reaper)`
5. Для готовых билдов давай ссылки на metabattle:
   `[Metabattle: Название билда](https://metabattle.com/wiki/Название_билда)`
6. Пиши на русском языке, простым и понятным языком.
7. Будь дружелюбным и полезным, как опытный наставник.

Формат ответа (строго следуй этому формату):

**ОБЗОР**
Краткое описание того, что находится в инвентаре/банке: количество предметов, общая ценность, интересные находки. Если есть дорогие предметы — укажи их примерную стоимость.

**ЦЕННЫЕ ПРЕДМЕТЫ**
Перечисли самые ценные предметы (по цене продажи или редкости):
- ![Название](иконка) [Название](ссылка на wiki) — почему ценен, что с ним делать (продать/оставить/использовать)

**ЧТО МОЖНО ПРОДАТЬ**
Список предметов, которые смело можно продать на Торговой Площадке:
- [Название](ссылка на wiki) — примерная цена, причина продажи

**ЧТО СТОИТ ОСТАВИТЬ**
Предметы, которые пригодятся в будущем:
- [Название](ссылка на wiki) — для чего нужен

**СОВЕТЫ ПО УЛУЧШЕНИЮ (ПО ШАГАМ)**
Шаг 1: [самое важное, что сделать прямо сейчас — например, продать хлам]
Шаг 2: [что улучшить с небольшими затратами]
Шаг 3: [на что копить в долгую]
Шаг 4: [какие характеристики важнее всего для текущего билда]
Шаг 5: [где найти готовые билды — ссылка на metabattle]"""


def analyze_inventory_text(name: str, bags: list) -> str:
    prompt = f"[АНАЛИЗ ИНВЕНТАРЯ ПЕРСОНАЖА]\n\nИмя персонажа: {name}\n\nСодержимое сумок:\n"

    total_items = 0
    has_content = False

    for bag_idx, bag_items in enumerate(bags):
        if bag_items:
            has_content = True
            prompt += f"\nСумка {bag_idx + 1}:\n"
            for slot in bag_items:
                if slot:
                    total_items += 1
                    item_name = slot.get('name', f"ID:{slot.get('id', '?')}")
                    count = slot.get('count', 1)
                    rarity = slot.get('rarity', 'N/A')
                    level = slot.get('level', 0)
                    binding = slot.get('binding', '')
                    binding_str = " (привязка)" if binding else ""
                    icon = slot.get('icon', '')
                    wiki_url = f"https://wiki.guildwars2.com/wiki/{item_name.replace(' ', '_')}"
                    if icon:
                        prompt += f"  - ![{item_name}]({icon}) [{item_name}]({wiki_url}) x{count}, редкость: {rarity}, уровень: {level}{binding_str}\n"
                    else:
                        prompt += f"  - [{item_name}]({wiki_url}) x{count}, редкость: {rarity}, уровень: {level}{binding_str}\n"

    if not has_content or total_items == 0:
        prompt += "  Инвентарь пуст.\n"

    prompt += f"\nВсего предметов: {total_items}"
    prompt += f"\n\n---\n\n{INVENTORY_INSTRUCTIONS}"
    return prompt
