import json
import urllib.request
import ssl

api_key = '57C75E77-AA36-1744-905F-02C648ED1D7CCD3D3E4B-F805-44D1-85E6-24BFA880B227'
ctx = ssl.create_default_context()

for char_name in ['Vasiluna', 'Fesstal', 'Khaank']:
    print()
    print('=== Equipment for ' + char_name + ' ===')
    try:
        req = urllib.request.Request(
            'https://api.guildwars2.com/v2/characters/' + char_name + '/equipment',
            headers={'Authorization': 'Bearer ' + api_key}
        )
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        data = json.loads(resp.read())
        if 'text' in data:
            print('ERROR:', data.get('text'))
            continue
        equipment = data.get('equipment', [])
        print('Count:', len(equipment))
        for eq in equipment[:8]:
            stats = eq.get('stats') or {}
            slot = eq.get('slot', '?')
            item_id = eq.get('id', '?')
            print('  Slot: ' + slot + ', Item: ' + str(item_id) + ', stats=' + json.dumps(stats, ensure_ascii=False)[:200])
    except Exception as e:
        print('Exception:', str(e))
