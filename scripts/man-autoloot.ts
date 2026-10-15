// ============================================================================
//  Automatický loot těl – ClassicUO Web
//  Podle Phoenix Loot.cs (LootGround). Běží na pozadí a lootuje těla v dosahu:
//   - tělo s "Loot" bagem (shard tím říká, že ho smíš lootovat), nebo tělo
//     těsně vedle tebe (vzdálenost <= 1)
//   - bere jen věci ze seznamu LOOT_ITEMS + všechna reagencie
//   - když máš dwarf knife, tělo po vylootování rozřeže a lootuje znovu
//   - sbírá i loot bagy ležící na zemi
// ============================================================================

// ------------------------------- KONFIGURACE --------------------------------

const CORPSE_GRAPHIC = 0x2006;
const SCAN_RANGE     = 6;   // jak daleko těla sledovat
const REACH          = 2;   // odkud se dá tělo otevřít / brát z něj

// Kam lootovat: 0 = první bag 0x0E76 v batohu (jako Phoenix), jinak serial
const LOOT_BAG_SERIAL = 0;
const BAG_GRAPHIC     = 0x0E76;

// Shardový "Loot" bag v těle
const LOOT_BAG_HUE  = 0x049A;
const LOOT_BAG_NAME = 'Loot'; // nebarevný bag s tímto jménem znamená totéž

// Dwarf knife – rozřezání těla po lootu
const USE_KNIFE     = true;
const KNIFE_GRAPHIC = 0x10E4;

// Co lootovat: [graphic, hue]; hue 0 = jakákoli barva (převzato z Phoenixu)
const LOOT_ITEMS: [number, number, string][] = [
    [0x0E76, 0x049A, 'loot bag'],
    [0x1F13, 0x0000, 'skillpoint'],
    [0x0F0D, 0x000E, 'lavabomb'],
    [0x0F7D, 0x031D, 'darkblood'],
    [0x0F82, 0x0000, 'dragonblood'],
    [0x1078, 0x0615, 'darkhide'],
    [0x0E80, 0x0123, 'pokladek'],
    [0x1010, 0x0000, 'wrong klicek'],
    [0x1C18, 0x0000, 'craft olej'],
    [0x0F3F, 0x0000, 'sipy'],
    [0x1BFB, 0x0000, 'sipky'],
    [0x166F, 0x0000, 'parat harpye'],
    [0x1BD1, 0x0000, 'peri'],
    [0x0EED, 0x0000, 'GP'],
    [0x100E, 0x0000, 'klic Q3'],
    [0x0F27, 0x0000, 'slzy FDD a Blood'],
    [0x0E21, 0x0000, 'bandy'],
];
// Reagencie (0x0F78 – 0x0F91, všechny barvy) – Phoenix je lootoval vždy
const LOOT_REAGENTS = true;

// Hlášky
const CANT_REACH_TEXTS = ["You can't reach that"];

// Časování a váha
const POLL_DELAY     = 500;
const OPEN_DELAY     = 600;
const MOVE_DELAY     = 450;
const CUT_DELAY      = 700;
const WEIGHT_RESERVE = 10;

// --------------------------------- STAV -------------------------------------

const done = new Set<number>();    // vylootovaná těla
const opened = new Set<number>();  // otevřená těla (obsah už klient zná)
const lootTypes: [number, number][] = LOOT_ITEMS.map(([g, h]) => [g, h]);
if (LOOT_REAGENTS) for (let g = 0x0F78; g <= 0x0F91; g++) lootTypes.push([g, 0]);

function dist(e: any) {
    return Math.max(Math.abs(e.x - player.x), Math.abs(e.y - player.y));
}

function itemsIn(graphic: number, hue: number | undefined, source: any, range?: number): any[] {
    return client.findAllItemsOfType(graphic, hue, source, undefined, range) || [];
}

function lootBag(): any {
    if (LOOT_BAG_SERIAL) return LOOT_BAG_SERIAL;
    const bag = itemsIn(BAG_GRAPHIC, undefined, player.backpack, 0).find(b => b.hue !== LOOT_BAG_HUE)
             || client.findType(BAG_GRAPHIC, undefined, player.backpack, undefined, 0);
    return bag ? bag.serial : player.backpack;
}

function tooHeavy() {
    return player.weightMax > 0 && player.weight >= player.weightMax - WEIGHT_RESERVE;
}

function isOwnCorpse(c: any) {
    return !!(c.name && player.name && c.name.includes(player.name));
}

function openCorpse(c: any): boolean {
    if (opened.has(c.serial)) return true;
    journal.clear();
    player.use(c.serial);
    sleep(OPEN_DELAY);
    if (CANT_REACH_TEXTS.some(t => journal.containsText(t))) return false;
    opened.add(c.serial);
    return true;
}

// Má tělo shardový "Loot" bag?
function hasLootBag(c: any): boolean {
    if (itemsIn(BAG_GRAPHIC, LOOT_BAG_HUE, c.serial, 0).length > 0) return true;
    for (const b of itemsIn(BAG_GRAPHIC, undefined, c.serial, 0)) {
        let name = b.name;
        if (!name) {
            try { name = client.queryItemSingleClickName(b, 1000); } catch (e) { name = ''; }
        }
        if (name === LOOT_BAG_NAME) return true;
    }
    return false;
}

// Přesune všechny věci ze seznamu z kontejneru (tělo) do loot bagu
function lootFrom(source: number): number {
    const bag = lootBag();
    let moved = 0;
    for (const [g, h] of lootTypes) {
        for (const it of itemsIn(g, h || undefined, source, 0)) {
            if (tooHeavy()) return moved;
            player.moveItem(it, bag, undefined, undefined, undefined, it.amount);
            sleep(MOVE_DELAY);
            moved++;
        }
    }
    return moved;
}

function cutCorpse(c: any) {
    const knife = client.findType(KNIFE_GRAPHIC, undefined, player.backpack);
    if (!knife) return;
    player.use(knife.serial);
    if (target.waitTargetEntity(c.serial, 2000)) sleep(CUT_DELAY);
}

function lootCorpse(c: any) {
    if (!openCorpse(c)) return;
    const eligible = hasLootBag(c) || dist(c) <= 1;
    if (!eligible) return; // zkusí znovu, až budeš blíž

    client.headMsg('[Looting...]', c, 0x44);
    lootFrom(c.serial);
    if (USE_KNIFE && client.findObject(c.serial)) {
        cutCorpse(c);
        if (client.findObject(c.serial)) lootFrom(c.serial);
    }
    done.add(c.serial);
}

function lootGroundBags() {
    const bag = lootBag();
    for (const b of itemsIn(BAG_GRAPHIC, LOOT_BAG_HUE, 'world', REACH)) {
        if (tooHeavy()) return;
        player.moveItem(b, bag);
        sleep(MOVE_DELAY);
    }
}

function main() {
    client.sysMsg('Loot: běží.', 0x44);
    let warnedHeavy = false;
    while (true) {
        if (player.isDead) { sleep(2000); continue; }

        if (tooHeavy()) {
            if (!warnedHeavy) client.sysMsg('Loot: batoh je plný, nelootuji!', 33);
            warnedHeavy = true;
            sleep(2000);
            continue;
        }
        warnedHeavy = false;

        const corpses = itemsIn(CORPSE_GRAPHIC, undefined, 'world', SCAN_RANGE)
            .filter(c => !done.has(c.serial) && !isOwnCorpse(c) && dist(c) <= REACH)
            .sort((a, b) => dist(a) - dist(b));

        for (const c of corpses) lootCorpse(c);
        lootGroundBags();
        sleep(POLL_DELAY);
    }
}

main();
