TRADING_POST_INSTRUCTIONS = """
ВАЖНЫЕ ПРАВИЛА ФОРМАТИРОВАНИЯ:
1. Для названий предметов используй **жирный текст**.
2. Для ссылок используй формат: [текст ссылки](url).
3. Для иконок специализаций используй формат: ![описание](url_иконки).
4. Для списков используй '- ' в начале строки.
5. Для заголовков используй **ЗАГОЛОВОК:** в начале строки.
6. Все цены указывай в золотом формате: Xз Yс Zм (или Xg Ys Zc).
7. Если цена не указана в данных, пиши "Нет данных" или "N/A".
8. Не используй эмодзи вообще.
9. Ссылки на вики делай так: [Название предмета](https://wiki.guildwars2.com/wiki/Название)
"""


def analyze_trading_post_prompt(
    items_data: list[dict],
    exchange_rate: dict | None = None,
) -> str:
    prompt = "[АНАЛИЗ ТОРГОВОЙ ПЛОЩАДКИ]\n\n"

    prompt += "Текущие цены на предметы:\n"
    for item in items_data:
        name = item.get("name", f"ID:{item['id']}")
        icon = item.get("icon", "")
        buy_price = item.get("buy_price")
        sell_price = item.get("sell_price")
        buy_quantity = item.get("buy_quantity", 0)
        sell_quantity = item.get("sell_quantity", 0)
        rarity = item.get("rarity", "N/A")
        level = item.get("level", 0)
        item_type = item.get("type", "")

        prompt += f"\n  - **{name}**"
        if icon:
            prompt += f" ![icon]({icon})"
        prompt += f"\n    - Тип: {item_type}, Редкость: {rarity}, Уровень: {level}"
        if buy_price is not None:
            prompt += f"\n    - Цена покупки (самая высокая заявка): {buy_price} меди ({_format_gold(buy_price)})"
            prompt += f"\n    - Объём заявок на покупку: {buy_quantity} шт."
        if sell_price is not None:
            prompt += f"\n    - Цена продажи (самая низкая): {sell_price} меди ({_format_gold(sell_price)})"
            prompt += f"\n    - Объём предложений на продажу: {sell_quantity} шт."
        if buy_price is not None and sell_price is not None:
            spread = sell_price - buy_price
            spread_percent = ((sell_price - buy_price) / buy_price * 100) if buy_price > 0 else 0
            prompt += f"\n    - Спред (разница): {_format_gold(spread)} ({spread_percent:.1f}%)"
            roi = ((sell_price - buy_price) / buy_price * 100) if buy_price > 0 else 0
            prompt += f"\n    - Потенциальная прибыль с единицы: {_format_gold(spread)} ({roi:.1f}%)"

    if exchange_rate:
        prompt += "\n\nКурс обмена:\n"
        for key, value in exchange_rate.items():
            prompt += f"  - {key}: {value}\n"

    prompt += f"""
\n\n---\n\n{TRADING_POST_INSTRUCTIONS}

Проанализируй текущую ситуацию на торговой площадке на основе предоставленных данных.
Для каждого предмета дай рекомендацию: стоит ли покупать сейчас, продавать или подождать.
Учитывай спред (разницу между ценой покупки и продажи), объём торгов и редкость предмета.
Дай общую оценку рыночной ситуации."""
    return prompt


def _format_gold(copper: int) -> str:
    copper = abs(copper)
    g = copper // 10000
    s = (copper % 10000) // 100
    c = copper % 100
    if g > 0:
        return f"{g}з {s}с {c}м"
    elif s > 0:
        return f"{s}с {c}м"
    else:
        return f"{c}м"
