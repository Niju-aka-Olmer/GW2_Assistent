def format_equipment_for_prompt(equipment: list[dict]) -> str:
    if not equipment:
        return "  (нет данных об экипировке)"

    lines = []
    for eq in equipment:
        stats_str = ""
        if eq.get("stats"):
            attrs = eq["stats"].get("attributes", {})
            stats_parts = [f"{k}={v}" for k, v in attrs.items()]
            stats_str = f" [{', '.join(stats_parts)}]"
        lines.append(
            f"  - {eq.get('name', '?')} "
            f"({eq.get('rarity', '?')}, lvl {eq.get('level', '?')})"
            f"{stats_str}"
            f" [слот: {eq.get('slot', '?')}]"
        )
    return "\n".join(lines)


def format_specializations_for_prompt(specializations: list[dict]) -> str:
    if not specializations:
        return "  (нет специализаций)"

    lines = []
    for spec in specializations:
        traits = spec.get("selected_traits", [])
        trait_ids = ", ".join(str(t) for t in traits if t)
        lines.append(
            f"  - {spec.get('name', '?')} "
            f"(трейты: {trait_ids or 'не выбраны'})"
            f" [иконка: {spec.get('icon', '')}]"
        )
    return "\n".join(lines)


def build_analysis_prompt(
    name: str,
    profession: str,
    specializations: list[dict],
    equipment: list[dict],
) -> str:
    spec_text = format_specializations_for_prompt(specializations)
    equip_text = format_equipment_for_prompt(equipment)

    return (
        f"Проанализируй билд персонажа {name} ({profession}) в Guild Wars 2.\n\n"
        f"### Специализации:\n{spec_text}\n\n"
        f"### Экипировка:\n{equip_text}\n\n"
        "Дай оценку билду по следующим пунктам:\n"
        "1. Общая оценка эффективности билда (PvE открытый мир/фракталы/рейды)\n"
        "2. Атрибуты — соответствуют ли выбранной роли (DPS/Support/Condi)?\n"
        "3. Рекомендации по улучшению (какие предметы/специализации заменить)\n"
        "4. Сильные и слабые стороны текущей сборки\n\n"
        "Ответ напиши на русском языке, кратко и по делу."
    )


def analyze_build_text(
    name: str,
    profession: str,
    specializations: list[dict],
    equipment: list[dict],
) -> str:
    return build_analysis_prompt(name, profession, specializations, equipment)
