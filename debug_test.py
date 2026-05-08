import json
import httpx
import sys

async def test():
    api_key = '57C75E77-AA36-1744-905F-02C648ED1D7CCD3D3E4B-F805-44D1-85E6-24BFA880B227'
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for char_name in ['Vasiluna', 'Fesstal', 'Khaank']:
            print()
            print('=== ' + char_name + ' (equipment from GW2 API) ===')
            resp = await client.get(
                'https://api.guildwars2.com/v2/characters/' + char_name + '/equipment',
                headers={'Authorization': 'Bearer ' + api_key}
            )
            data = resp.json()
            if 'text' in data:
                print('GW2 ERROR:', data.get('text'))
                continue
            equipment = data.get('equipment', [])
            print('Equipment count:', len(equipment))
            for eq in equipment[:8]:
                stats = eq.get('stats', {})
                slot = eq.get('slot', '?')
                print('  Slot: ' + slot + ', Item: ' + str(eq.get('id', '?')) + ', stats=' + json.dumps(stats, ensure_ascii=False)[:200])

import asyncio
asyncio.run(test())
