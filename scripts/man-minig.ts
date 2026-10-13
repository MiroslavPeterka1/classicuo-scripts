// ============================================================================
//  Automatický mining – ClassicUO Web
//  Domov (secure truhla) -> runa do dolu -> kopání po bodech -> pec -> NB runa domů
// ============================================================================

// ------------------------------- KONFIGURACE --------------------------------

// Secure truhla a její obsah
const SECURE_CHEST = 0x400AE883; // serial secure truhly u domu
const PICKAXE_BAG  = 0x40030A02; // pytlík s krumpáči (v truhle)
const PRODUCT_BAG  = 0x403FAA6D; // pytlík na ingoty a kameny (v truhle)
const MINE_RUNE    = 0x4007277D; // runa do dolu (v truhle)

// NB runa pro návrat domů (nosí se v batohu, hledá se podle graphic + hue)
const NB_RUNE_GRAPHIC = 0x1F14;
const NB_RUNE_HUE     = 0x0B1D;

// Gumpy
const RUNE_GUMP            = 0x2B1;
const RUNE_RECALL_SWITCH   = 0x0;
const RUNE_CONTINUE_BUTTON = 1;
const NB_GUMP          = 0x80A00435;
const NB_HOME_BUTTON   = 1;

// Domov: místo, odkud se script spouští a odkud jde otevřít truhla.
const HOME_START = { x: 313, y: 3372 };

// Důl: body, mezi kterými se postava pohybuje (v tomto pořadí).
// Mezi dvěma po sobě jdoucími body musí jít dojít rovně (i šikmo).
// Na každém bodě vykope čtverec MINE_RANGE polí na každou stranu.
const MINE_WAYPOINTS = [
    { x: 1382, y: 2710 },
    { x: 1370, y: 2710 },
    { x: 1371, y: 2717 },
    { x: 1366, y: 2725 },
];
// Linie konce dolu (zeď): tato pole se nekopou a postava na ně nevstoupí.
// Kdyby na ni přesto vstoupila, kopání končí (bod 10).
const MINE_END_LINE = [
    { x: 1366, y: 2730 },
    { x: 1367, y: 2730 },
    { x: 1368, y: 2730 },
];
const MINE_RANGE = 6;

// Pec: kam si stoupnout. Postava k ní dojde po bodech dolu až k bodu,
// který je peci nejblíž, a odtud rovně na FORGE_STAND.
const FORGE_STAND   = { x: 1379, y: 2706 };
const FORGE_GRAPHIC = 0x0FB1;

// Kopání
const PICKAXE_GRAPHIC  = 0x0E85;
const PICKAXES_WANTED  = 15;
// Hlášky, že úder skončil (ruda získaná nebo nezískaná)
const END_ACTION_TEXTS = [
    'You put the iron ore in your pack.',
    'You put the copper ore in your pack.',
    'You put the bronze ore in your pack.',
    'You put the silver ore in your pack.',
    'You put the shadow ore in your pack.',
    'You put the rose ore in your pack.',
    'You put the gold ore in your pack.',
    'You put the verite ore in your pack.',
    'You put the valorite ore in your pack.',
    'You put the blood rock ore in your pack.',
    'You put the black rock ore in your pack.',
    'You put the mytheril ore in your pack.',
    'You put the star sapphire ore in your pack.',
    'You put the star emerald ore in your pack.',
    'You put the star citrine ore in your pack.',
    'You put the star amethyst ore in your pack.',
    'You put the star ruby ore in your pack.',
    'You put the star diamond ore in your pack.',
    'You loosen some rocks but fail to find any usable ore.',
];
// Hlášky, že na poli nic není / nejde kopat -> další pole
const TILE_EMPTY_TEXTS = [
    'There is no ore here to mine.',
    'Try mining in rock.',
    'There is nothing here to mine for.',
    'Try mining elsewhere.',
    'You have no line of sight to that location',
];
// Hlášky, kdy pole nejde kopat (moc daleko, není vidět...). DOPLNIT podle shardu.
const TILE_FAIL_TEXTS: string[] = ['That is too far away.', 'Target cannot be seen.'];
const STRIKE_TIMEOUT       = 8000;
const MAX_STRIKES_PER_TILE = 40;

// Váha a bezpečnost
const WEIGHT_RESERVE      = 20;  // "plný batoh" = weightMax - rezerva
const HOME_WEIGHT_RATIO   = 0.8; // po tavení nad tímto podílem -> domů
const WEIGHT_MAX_FALLBACK = 500; // když klient weightMax nezná
const HP_FLEE_RATIO       = 0.6; // pod tímto podílem HP -> útěk

// Útěk při objevení kohokoli v dole
const FLEE_ON_MOBILE    = true;
const FLEE_MOBILE_TYPE  = 'human'; // 'human' = jen lidské postavy, 'any' = i monstra a zvířata
const FLEE_MOBILE_RANGE = 18;      // vzdálenost v polích (18 ≈ celá obrazovka)
const FLEE_IGNORE: number[] = [];  // serialy, kvůli kterým neutíkat (vlastní pet, kamarád...)

// Rudy a produkty tavení
const ORE_GRAPHICS     = [0x19B7, 0x19B8, 0x19B9, 0x19BA];
const PRODUCT_GRAPHICS = [
    0x1BEF, 0x1BE3, 0x1BF5, 0x1BE9,                 // ingoty (všechny hue)
    0x0F0F, 0x0F10, 0x0F26, 0x0F16, 0x0F15, 0x0F13, // kameny
];

// Časování
const MOVE_DELAY       = 700;
const SMELT_DELAY      = 1200;
const TELEPORT_TIMEOUT = 60000;

// --------------------------------- STAV -------------------------------------

type P = { x: number; y: number };

const HOME_MARK: P = { x: HOME_START.x, y: HOME_START.y + 1 };
const K = (x: number, y: number) => x + ',' + y;
const WP: P[] = MINE_WAYPOINTS;

const AT_ARRIVAL = -1; // stojí na místě příletu runy
const AT_FORGE   = -2; // stojí u pece

const done = new Set<string>(); // vytěžená pole (přežije i cestu domů)
const lineSet = new Set<string>(MINE_END_LINE.map(p => K(p.x, p.y)));
const onLine = () => lineSet.has(K(player.x, player.y));
let curWp = AT_ARRIVAL;         // na kterém bodě postava stojí
let resumeWp = 0;               // na kterém bodě se naposledy kopalo
let arrival: P | null = null;

// index bodu, který je nejblíž peci
const FORGE_WP = WP.reduce((best, p, i) =>
    dist(p, FORGE_STAND) < dist(WP[best], FORGE_STAND) ? i : best, 0);

// směry 0..7: N, NE, E, SE, S, SW, W, NW
const DIR8: { [k: string]: number } = {
    '0,-1': 0, '1,-1': 1, '1,0': 2, '1,1': 3,
    '0,1': 4, '-1,1': 5, '-1,0': 6, '-1,-1': 7,
};

// -------------------------------- POMOCNÉ -----------------------------------

function pos(): P { return { x: player.x, y: player.y }; }
function at(p: P) { return player.x === p.x && player.y === p.y; }
function dist(a: P, b: P) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
function maxW() { return player.weightMax > 0 ? player.weightMax : WEIGHT_MAX_FALLBACK; }

function alarm(text: string, hue = 33) {
    client.headMsg(text, player, hue);
    client.sysMsg(text, hue);
    log(text);
    try {
        const g: any = globalThis as any;
        const AC = g.AudioContext || g.webkitAudioContext;
        if (AC) {
            const ctx = new AC();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 880;
            gain.gain.value = 0.2;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.8);
        }
    } catch (e) { /* zvuk není k dispozici */ }
}

function stop(text: string, hue = 33) {
    alarm(text, hue);
    exit();
}

function waitUntil(cond: () => boolean, timeout: number, tick: (() => void) | null, interval: number) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
        if (cond()) return true;
        if (tick) tick();
        sleep(interval);
    }
    return cond();
}

function items(graphic: number, hue: number | undefined, container: any): any[] {
    return client.findAllItemsOfType(graphic, hue, container) || [];
}

function countItems(graphic: number, hue: number | undefined, container: any) {
    return items(graphic, hue, container).reduce((s, i) => s + (i.amount || 1), 0);
}

function countPickaxes() { return items(PICKAXE_GRAPHIC, undefined, player.backpack).length; }
function hasOre() { return ORE_GRAPHICS.some(g => items(g, undefined, player.backpack).length > 0); }

function openContainer(serial: number) {
    player.use(serial);
    sleep(800);
}

let fleeReason = '';

function nearbyStranger(): any {
    if (!FLEE_ON_MOBILE) return null;
    const m = client.selectEntity(
        SearchEntityOptions.Any,
        SearchEntityRangeOptions.Nearest,
        FLEE_MOBILE_TYPE === 'human' ? SearchEntityTypeOptions.Human : SearchEntityTypeOptions.Any,
        false);
    if (!m || m.serial === player.serial || FLEE_IGNORE.includes(m.serial)) return null;
    if (dist({ x: m.x, y: m.y }, pos()) > FLEE_MOBILE_RANGE) return null;
    return m;
}

function checkSafety() {
    if (player.isDead) stop('Postava je mrtvá!');
    const mh = player.maxHits;
    if (mh > 0 && player.hits < mh * HP_FLEE_RATIO) {
        fleeReason = 'NÍZKÉ HP';
        throw 'FLEE';
    }
    const m = nearbyStranger();
    if (m) {
        fleeReason = `objevil se ${m.name || 'někdo'} (${m.serial.toString(16)})`;
        throw 'FLEE';
    }
}

// -------------------------------- POHYB -------------------------------------

function tryStep(dx: number, dy: number): boolean {
    const dir = DIR8[dx + ',' + dy];
    const sx = player.x, sy = player.y;
    // první walk() do jiného směru postavu jen otočí
    const attempts = ((player.direction & 7) === dir) ? 2 : 3;
    for (let i = 0; i < attempts; i++) {
        player.walk(dir as any);
        const t0 = Date.now();
        while (Date.now() - t0 < 500) {
            sleep(50);
            if (player.x === sx + dx && player.y === sy + dy) return true;
        }
    }
    return player.x === sx + dx && player.y === sy + dy;
}

// Jeden krok směrem k cíli; když je přímý směr blokovaný, zkusí obejít bokem.
function stepToward(t: P): boolean {
    const dx = Math.sign(t.x - player.x), dy = Math.sign(t.y - player.y);
    const opts: number[][] = [[dx, dy]];
    if (dx && dy) opts.push([dx, 0], [0, dy]);
    else if (dx) opts.push([dx, -1], [dx, 1]);
    else opts.push([-1, dy], [1, dy]);
    return opts
        .filter(([ox, oy]) => !lineSet.has(K(player.x + ox, player.y + oy)))
        .some(([ox, oy]) => tryStep(ox, oy));
}

function walkTo(t: P, safety = true): boolean {
    if (player.weight > maxW()) alarm('Jsem přetížený, nemůžu chodit!');
    let fails = 0;
    const maxSteps = dist(pos(), t) * 3 + 20;
    for (let s = 0; s < maxSteps && !at(t); s++) {
        if (safety) checkSafety();
        if (stepToward(t)) fails = 0;
        else {
            if (++fails >= 5) return false;
            sleep(1000);
        }
    }
    return at(t);
}

// Chůze po bodech dolu z curWp na bod `to`
function goToWp(to: number): boolean {
    if (curWp === AT_ARRIVAL) {
        if (!walkTo(WP[0])) return false;
        curWp = 0;
    }
    if (curWp === AT_FORGE) {
        if (!walkTo(WP[FORGE_WP])) return false;
        curWp = FORGE_WP;
    }
    while (curWp !== to) {
        const next = curWp + (to > curWp ? 1 : -1);
        if (!walkTo(WP[next])) return false;
        curWp = next;
    }
    return true;
}

// -------------------------------- KOPÁNÍ ------------------------------------

function tooHeavy() { return player.weight >= maxW() - WEIGHT_RESERVE; }

function strikeTile(x: number, y: number): string {
    journal.clear();
    if (!player.useType(PICKAXE_GRAPHIC, undefined, player.backpack)) return 'nopick';
    if (!target.wait(3000)) return 'timeout';
    target.terrain(x, y, player.z);
    const r = journal.waitForTextAny(
        [...END_ACTION_TEXTS, ...TILE_EMPTY_TEXTS, ...TILE_FAIL_TEXTS], undefined, STRIKE_TIMEOUT);
    if (r === null) return 'timeout';
    sleep(150);
    if ([...TILE_EMPTY_TEXTS, ...TILE_FAIL_TEXTS].some(t => journal.containsText(t))) return 'empty';
    return 'ok';
}

function mineTile(x: number, y: number) {
    for (let i = 0; i < MAX_STRIKES_PER_TILE; i++) {
        checkSafety();
        if (countPickaxes() === 0) throw 'NOPICK';
        if (tooHeavy()) throw 'HEAVY';
        const r = strikeTile(x, y);
        if (r === 'nopick') throw 'NOPICK';
        if (r === 'empty' || r === 'timeout') break;
    }
    done.add(K(x, y));
}

// Pořadí polí čtverce kolem bodu (od středu ven) – vždy stejné, takže jde navázat
function squareTiles(c: P): P[] {
    const tiles: any[] = [];
    for (let dy = -MINE_RANGE; dy <= MINE_RANGE; dy++) {
        for (let dx = -MINE_RANGE; dx <= MINE_RANGE; dx++) {
            tiles.push({ x: c.x + dx, y: c.y + dy, d: Math.max(Math.abs(dx), Math.abs(dy)) });
        }
    }
    tiles.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    return tiles;
}

// Vykope čtverec kolem bodu č. i; už vytěžená pole přeskočí,
// takže po návratu od pece / z domu pokračuje tam, kde skončil.
function mineSquare(i: number) {
    const tiles = squareTiles(WP[i]);
    const left = tiles.filter(t => !done.has(K(t.x, t.y)) && !lineSet.has(K(t.x, t.y)));
    if (left.length < tiles.length && left.length > 0) {
        log(`Bod ${i + 1}/${WP.length}: pokračuji, zbývá ${left.length} z ${tiles.length} polí.`);
    }
    for (const t of left) mineTile(t.x, t.y);
}

// Vrací 'HEAVY' | 'NOPICK' | 'END' | 'FLEE'
function miningSession(): string {
    try {
        for (let i = resumeWp; i < WP.length; i++) {
            resumeWp = i;
            if (!goToWp(i)) {
                if (onLine()) return 'END';
                stop(`Nedošel jsem na bod dolu č. ${i} (${WP[i].x}, ${WP[i].y})!`);
            }
            if (onLine()) return 'END';
            mineSquare(i);
        }
        return 'END';
    } catch (e) {
        if (e === 'HEAVY' || e === 'NOPICK' || e === 'FLEE') return e as string;
        throw e;
    }
}

// -------------------------------- TAVENÍ ------------------------------------

function smeltAll() {
    const forge = client.findType(FORGE_GRAPHIC, undefined, 'world', undefined, 3);
    if (!forge) stop('Pec nenalezena poblíž!');
    const tries = new Map<number, number>();
    ignoreList.clear();
    for (let i = 0; i < 300; i++) {
        checkSafety();
        let ore: any = null;
        for (const g of ORE_GRAPHICS) {
            ore = client.findType(g, undefined, player.backpack);
            if (ore) break;
        }
        if (!ore) break;
        const n = (tries.get(ore.serial) || 0) + 1;
        tries.set(ore.serial, n);
        if (n > 20) { ignoreList.add(ore); continue; }
        player.use(forge);
        target.waitTargetEntity(ore, 3000);
        sleep(SMELT_DELAY);
    }
    ignoreList.clear();
    if (hasOre()) alarm('Část rudy se nepodařilo přetavit.', 0x35);
}

// Dojde k peci a přetaví všechnu rudu. Vrací 'OK' | 'FLEE'
function smeltTrip(): string {
    try {
        if (!hasOre()) return 'OK';
        if (curWp !== AT_FORGE) {
            if (!goToWp(FORGE_WP)) stop('Nedošel jsem k peci (po bodech dolu)!');
            if (!walkTo(FORGE_STAND)) stop('Nedošel jsem k peci!');
            curWp = AT_FORGE;
        }
        smeltAll();
        return 'OK';
    } catch (e) {
        if (e === 'FLEE') return 'FLEE';
        throw e;
    }
}

// ------------------------------ TELEPORTY -----------------------------------

function useRune(): boolean {
    player.use(MINE_RUNE);
    const g = Gump.findOrWait(RUNE_GUMP, 3000);
    if (!g) return false;
    g.setCheckbox(RUNE_RECALL_SWITCH, true);
    g.reply(RUNE_CONTINUE_BUTTON);
    return true;
}

function useNbRune(): boolean {
    const rune = client.findType(NB_RUNE_GRAPHIC, NB_RUNE_HUE, player.backpack);
    if (!rune) { alarm('NB runa není v batohu!'); return false; }
    player.use(rune.serial);
    const g = Gump.findOrWait(NB_GUMP, 3000);
    if (!g) return false;
    client.headMsg('Port domů teď!', player.serial, 0x63);
    g.reply(NB_HOME_BUTTON);
    return true;
}

function departToMine() {
    for (let a = 1; a <= 3; a++) {
        player.moveItem(MINE_RUNE, player.backpack);
        sleep(MOVE_DELAY);
        if (!client.findObject(MINE_RUNE, undefined, player.backpack)) stop('Runa není v batohu!');

        const used = useRune();
        sleep(500);
        openContainer(SECURE_CHEST);
        player.moveItem(MINE_RUNE, SECURE_CHEST); // runa zpět, teleport mezitím běží
        sleep(MOVE_DELAY);

        if (!used) { alarm('Gump runy se neotevřel, zkouším znovu.', 0x35); continue; }
        if (waitUntil(() => dist(pos(), HOME_START) > 30, TELEPORT_TIMEOUT, null, 1000)) {
            sleep(1500);
            arrival = pos();
            curWp = AT_ARRIVAL;
            return;
        }
        alarm('Teleport do dolu neproběhl, zkouším znovu.', 0x35);
    }
    stop('Teleport do dolu opakovaně selhal!');
}

// Při útěku couvá po bodech dolu směrem k místu příletu
function fleeTick() {
    let t: P;
    if (curWp === AT_FORGE) t = WP[FORGE_WP];
    else if (curWp > 0) t = WP[curWp - 1];
    else t = arrival || WP[0];
    if (at(t)) {
        if (curWp === AT_FORGE) curWp = FORGE_WP;
        else if (curWp > 0) curWp--;
        return;
    }
    stepToward(t);
}

function travelHome(flee: boolean) {
    for (let a = 1; a <= 3; a++) {
        if (!useNbRune()) { sleep(2000); continue; }
        const ok = waitUntil(() => dist(pos(), HOME_START) <= 3, TELEPORT_TIMEOUT,
            flee ? fleeTick : null, flee ? 300 : 1000);
        if (ok) {
            sleep(1000);
            // NB runa může mířit přímo na HOME_START, nebo o pole jižněji
            if (at(HOME_MARK)) {
                for (let i = 0; i < 5 && !at(HOME_START); i++) { tryStep(0, -1); sleep(300); }
            }
            if (!at(HOME_START)) stop('Po návratu nestojím na výchozím místě u truhly!');
            return;
        }
        alarm('Teleport domů neproběhl, zkouším znovu.', 0x35);
    }
    stop('Teleport domů opakovaně selhal!');
}

function flee() {
    alarm(`${fleeReason} – utíkám domů!`);
    travelHome(true);
    openContainer(SECURE_CHEST);
    storeProducts();
    stop(`Útěk z dolu (${fleeReason}) – postava je doma. Spusť script znovu, až bude bezpečno.`);
}

// ---------------------------------- DOMA ------------------------------------

function storeProducts() {
    for (const g of PRODUCT_GRAPHICS) {
        for (const it of items(g, undefined, player.backpack)) {
            player.moveItem(it, PRODUCT_BAG, undefined, undefined, undefined, it.amount);
            sleep(MOVE_DELAY);
        }
    }
}

function homeService() {
    openContainer(SECURE_CHEST);
    storeProducts(); // bod 0

    const have = countPickaxes();
    if (have < PICKAXES_WANTED) {
        openContainer(PICKAXE_BAG);
        const src = items(PICKAXE_GRAPHIC, undefined, PICKAXE_BAG);
        const need = Math.min(PICKAXES_WANTED - have, src.length);
        for (let i = 0; i < need; i++) {
            player.moveItem(src[i], player.backpack);
            sleep(MOVE_DELAY);
        }
    }
    if (countPickaxes() === 0) stop('Došly krumpáče!');
    if (countPickaxes() < PICKAXES_WANTED) alarm('Varování: v pytlíku dochází krumpáče.', 0x35);

    if (!client.findType(NB_RUNE_GRAPHIC, NB_RUNE_HUE, player.backpack)) stop('NB runa není v batohu!');
}

// ---------------------------------- MAIN ------------------------------------

function main() {
    if (WP.length === 0) stop('Nejsou zadané body dolu (MINE_WAYPOINTS).');
    if (!at(HOME_START)) stop('Spusť script na výchozím místě u secure truhly.');

    while (true) {
        homeService();
        departToMine();

        let finished = false;
        while (true) {
            const r = miningSession();
            if (r === 'FLEE') flee();

            // HEAVY, NOPICK i END: vždy nejdřív k peci a přetavit rudu
            if (smeltTrip() === 'FLEE') flee();

            if (r === 'END') { finished = true; break; }
            if (r === 'NOPICK') break;
            // HEAVY: po přetavení buď domů, nebo zpět kopat
            if (player.weight > maxW() * HOME_WEIGHT_RATIO) break;
        }

        travelHome(false);
        if (finished) {
            openContainer(SECURE_CHEST);
            storeProducts();
            stop('Důl je vytěžený, hotovo!', 0x44);
        }
    }
}

main();
