from typing import Optional


def format_inventory_for_prompt(
    bags: list[list[Optional[dict]]],
    max_items: int = 50,
) -> str:
    count = 0
    lines = []
    for bag_idx, bag in enumerate(bags):
        if not bag:
            continue
        for slot in bag:
            if not slot:
                continue
            if count >= max_items:
                lines.append(f"  ... и ещё {sum(1 for b in bags for s in (b or []) if s) - count} предметов")
                return "\n".join(lines)
            count += 1
            lines.append(
                f"  - {slot.get('name', '?')} "
                f"x{slot.get('count', 1)} "
                f"({slot.get('rarity', '?')}, lvl {slot.get('level', '?')})"
                f"{' [привязано]' if slot.get('binding') else ''}"
            )
    return "\n".join(lines) if lines else "  (инвентарь пуст)"


def build_inventory_analysis_prompt(
    name: str,
    bags: list[list[Optional[dict]]],
) -> str:
    inv_text = format_inventory_for_prompt(bags)

    return (
        f"Проанализируй инвентарь персонажа {name} в Guild Wars 2.\n\n"
        f"### Инвентарь:\n{inv_text}\n\n"
        "Дай анализ по следующим пунктам:\n"
        "1. Какие ценные предметы стоит продать на торговой площадке?\n"
        "2. Какие предметы стоит сохранить для крафта/билдов?\n"
        "3. Есть ли мусор (trash items), который можно сразу продать вендору?\n"
        "4. Общая оценка — много ли ценного в инвентаре?\n\n"
        "Ответ напиши на русском языке, кратко и по делу."
    )


def bank_analysis_prompt(
    bank: list[Optional[dict]],
) -> str:
    bank_text = format_inventory_for_prompt([bank])

    return (
        "Проанализируй содержимое банка аккаунта Guild Wars 2.\n\n"
        f"### Банк:\n{bank_text}\n\n"
        "Дай анализ по следующим пунктам:\n"
        "1. Есть ли ценные предметы для продажи?\n"
        "2. Какие предметы стоит забрать для персонажа?\n"
        "3. Есть ли мусор для очистки?\n"
        "4. Общая оценка заполненности банка.\n\n"
        "Ответ напиши на русском языке, кратко и по делу."
    )


def analyze_inventory_text(
    name: str,
    bags: list[list[Optional[dict]]],
) -> str:
    return build_inventory_analysis_prompt(name, bags)
