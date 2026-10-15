// ============================================================================
//  Automatický lumberjacking – ClassicUO Web
//  Domov (secure truhla) -> runa / pěšky do lesa -> sekání po bodech
//  -> NB runa / pěšky domů
//  Kostra převzatá z mining scriptu; stromy se hledají automaticky kolem bodů.
// ============================================================================

// ------------------------------- KONFIGURACE --------------------------------

// Způsob cesty
//   TRAVEL_MODE: 'rune' = runou z truhly, 'walk' = pěšky po HOME_PATH
//   RETURN_MODE: 'nb'   = NB runou,       'walk' = pěšky zpět po bodech a HOME_PATH
// Útěk používá stejný způsob jako RETURN_MODE.
const TRAVEL_MODE: 'rune' | 'walk' = 'walk';
const RETURN_MODE: 'nb' | 'walk'   = 'nb';

// Cesta pěšky z domova k prvnímu bodu lesa (jen pro režim 'walk').
// Body mezi HOME_START a WOOD_WAYPOINTS[0], bez nich samotných.
// Mezi dvěma po sobě jdoucími body musí jít dojít rovně (i šikmo).  (DOPLNIT)
const HOME_PATH: { x: number; y: number }[] = [
    { x: 301, y: 3415 },
];

// Secure truhla a její obsah  (DOPLNIT serialy)
const SECURE_CHEST = 0x400AE883; // serial secure truhly u domu
const HATCHET_BAG  = 0x400330BD; // pytlík se sekerami (v truhle)
const LOG_BAG      = 0x403CA9CC; // pytlík na dřevo (v truhle)
const WOOD_RUNE    = 0x00000000; // runa do lesa (v truhle)

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

// Les: body, mezi kterými se postava pohybuje (v tomto pořadí).
// Mezi dvěma po sobě jdoucími body musí jít dojít rovně (i šikmo).
// Kolem každého bodu se najdou stromy ve čtverci TREE_SCAN_RANGE.  (DOPLNIT)
const WOOD_WAYPOINTS = [
    { x: 292, y: 3436 },
    { x: 280, y: 3447 },
    { x: 272, y: 3467 },
    { x: 266, y: 3459 },
    { x: 274, y: 3439 },
];
const TREE_SCAN_RANGE = 6;
const CHOP_DIST       = 2;   // z jaké vzdálenosti se dá sekat (Phoenix používal 2)

// Grafiky stromů (statiky) – převzato z Phoenix scriptu, případně doplnit
const TREE_GRAPHICS = [
    0x0CCA, 0x0CCB, 0x0CCC, 0x0CCD, 0x0CD0, 0x0CD3, 0x0CD6,
    0x0CD8, 0x0CDA, 0x0CDD, 0x0CE0, 0x0CE3, 0x0D01,
];

// Sekání
const HATCHET_GRAPHIC = 0x0F43;
const HATCHETS_WANTED = 5;
const LOG_GRAPHIC     = 0x1BDD; // všechny druhy dřeva (rozlišené hue)

// Hlášky, že úder skončil
const CHOP_END_TEXTS = [
    'You put the logs in your pack',
    'You hack at the tree for a while, but fail to produce any useable wood',
];
// Strom je vytěžený -> další strom
const TREE_EMPTY_TEXTS = [
    'There are no logs left here to chop',
    'There is nothing here to chop.'
];
// Strom nejde sekat (špatný cíl, daleko) -> další strom
const TREE_WRONG_TEXTS = [
    "You can't think of a way to use that item",
    "That's too far away to chop",
    'Try chopping a tree',
    "You can`t reach this.",
    "You can't reach this.",
    "You can't reach this.",
];
// Batoh je plný, dřevo padá na zem -> domů
const TOO_HEAVY_TEXTS = ['You put the logs at your feet. It is too heavy'];
// Shardová hláška o konci akce (Phoenix na ni čekal). '' = nečekat.
const ACTION_END_TEXT = 'akce skoncila';

const STRIKE_TIMEOUT       = 10000;
const MAX_STRIKES_PER_TREE = 40;

// Váha a bezpečnost
const WEIGHT_RESERVE      = 20;  // "plný batoh" = weightMax - rezerva
const WEIGHT_MAX_FALLBACK = 500; // když klient weightMax nezná
const HP_FLEE_RATIO       = 0.6; // pod tímto podílem HP -> útěk

// Útěk při objevení kohokoli v lese
const FLEE_ON_MOBILE    = false;
const FLEE_MOBILE_TYPE  = 'human'; // 'human' = jen lidské postavy, 'any' = i monstra a zvířata
const FLEE_MOBILE_RANGE = 18;
const FLEE_IGNORE: number[] = [];

// Časování
const MOVE_DELAY       = 700;
const TELEPORT_TIMEOUT = 60000;

// Ladění: vypíše do logu, co vrací client.getTerrainList() kolem prvního bodu
const DEBUG_TERRAIN = false;

// --------------------------------- STAV -------------------------------------

type P = { x: number; y: number };
type Tree = { x: number; y: number; z: number; graphic: number };

const HOME_MARK: P = { x: HOME_START.x, y: HOME_START.y + 1 };
const K = (x: number, y: number) => x + ',' + y;
const WP: P[] = WOOD_WAYPOINTS;
const TREE_SET = new Set<number>(TREE_GRAPHICS);

const AT_ARRIVAL = -1; // stojí na místě příletu runy

const done = new Set<string>(); // vytěžené stromy (přežije i cestu domů)
let curWp = AT_ARRIVAL;         // na kterém bodě postava stojí
let offWp = false;              // odešla od bodu ke stromu
let resumeWp = 0;               // na kterém bodě se naposledy sekalo
let arrival: P | null = null;
const NOT_ON_PATH = -2;
let pathIdx = NOT_ON_PATH;      // cestou pěšky do lesa: poslední dosažený bod HOME_PATH

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

function openContainer(serial: number) {
    player.use(serial);
    sleep(800);
}

// Sekera: nejdřív v ruce, pak v batohu
function findHatchet(): any {
    const eq: any = player.equippedItems || {};
    for (const it of [eq.oneHanded, eq.twoHanded]) {
        if (it && it.graphic === HATCHET_GRAPHIC) return it;
    }
    return client.findType(HATCHET_GRAPHIC, undefined, player.backpack);
}

function countHatchets() {
    const eq: any = player.equippedItems || {};
    const inHand = [eq.oneHanded, eq.twoHanded].filter(it => it && it.graphic === HATCHET_GRAPHIC).length;
    return items(HATCHET_GRAPHIC, undefined, player.backpack).length + inHand;
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

function stepToward(t: P): boolean {
    const dx = Math.sign(t.x - player.x), dy = Math.sign(t.y - player.y);
    const opts: number[][] = [[dx, dy]];
    if (dx && dy) opts.push([dx, 0], [0, dy]);
    else if (dx) opts.push([dx, -1], [dx, 1]);
    else opts.push([-1, dy], [1, dy]);
    return opts.some(([ox, oy]) => tryStep(ox, oy));
}

// Dojde k cíli na vzdálenost `near` (0 = přesně na pole)
function walkTo(t: P, safety = true, near = 0): boolean {
    if (player.weight > maxW()) alarm('Jsem přetížený, nemůžu chodit!');
    let fails = 0;
    const maxSteps = dist(pos(), t) * 3 + 20;
    for (let s = 0; s < maxSteps && dist(pos(), t) > near; s++) {
        if (safety) checkSafety();
        if (stepToward(t)) fails = 0;
        else {
            if (++fails >= 5) return false;
            sleep(1000);
        }
    }
    return dist(pos(), t) <= near;
}

// Chůze po bodech lesa z curWp na bod `to`
function goToWp(to: number, safety = true): boolean {
    if (curWp === AT_ARRIVAL) {
        if (!walkTo(WP[0], safety)) return false;
        curWp = 0;
    }
    if (offWp) {
        if (!walkTo(WP[curWp], safety)) return false;
        offWp = false;
    }
    while (curWp !== to) {
        const next = curWp + (to > curWp ? 1 : -1);
        if (!walkTo(WP[next], safety)) return false;
        curWp = next;
    }
    return true;
}

// --------------------------------- STROMY -----------------------------------

// Najde strom na poli (x, y). Tvar objektů z getTerrainList() dokumentace
// neuvádí, proto se čte obranně (graphic / Graphic / id, z / Z).
function treeAt(x: number, y: number): Tree | null {
    const list: any[] = (client.getTerrainList(x, y) as any[]) || [];
    for (const o of list) {
        if (!o) continue;
        const g = o.graphic ?? o.Graphic ?? o.id ?? o.tileId;
        if (TREE_SET.has(g)) {
            const z = o.z ?? o.Z ?? player.z;
            return { x, y, z, graphic: g };
        }
    }
    return null;
}

function treesAround(c: P): Tree[] {
    const out: Tree[] = [];
    for (let dy = -TREE_SCAN_RANGE; dy <= TREE_SCAN_RANGE; dy++) {
        for (let dx = -TREE_SCAN_RANGE; dx <= TREE_SCAN_RANGE; dx++) {
            const t = treeAt(c.x + dx, c.y + dy);
            if (t) out.push(t);
        }
    }
    return out;
}

function debugTerrain() {
    const c = WP[0];
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            log(`(${c.x + dx}, ${c.y + dy}): ` + JSON.stringify(client.getTerrainList(c.x + dx, c.y + dy)));
        }
    }
}

// -------------------------------- SEKÁNÍ ------------------------------------

function tooHeavy() { return player.weight >= maxW() - WEIGHT_RESERVE; }

function strikeTree(t: Tree): string {
    journal.clear();
    const h = findHatchet();
    if (!h) return 'notool';
    player.use(h.serial);
    if (!target.wait(3000)) return 'timeout';
    target.terrain(t.x, t.y, t.z, t.graphic);
    const all = [...CHOP_END_TEXTS, ...TREE_EMPTY_TEXTS, ...TREE_WRONG_TEXTS, ...TOO_HEAVY_TEXTS];
    if (ACTION_END_TEXT) all.push(ACTION_END_TEXT);
    const r = journal.waitForTextAny(all, undefined, STRIKE_TIMEOUT);
    if (r === null) return 'timeout';
    // počkat na shardovou hlášku o konci akce, ať další úder nezačne moc brzy
    if (ACTION_END_TEXT && !journal.containsText(ACTION_END_TEXT)) {
        journal.waitForTextAny([ACTION_END_TEXT], undefined, 3000);
    }
    sleep(150);
    if (TOO_HEAVY_TEXTS.some(x => journal.containsText(x))) return 'heavy';
    if (TREE_EMPTY_TEXTS.some(x => journal.containsText(x))) return 'empty';
    if (TREE_WRONG_TEXTS.some(x => journal.containsText(x))) return 'wrong';
    return 'ok';
}

function chopTree(t: Tree) {
    if (dist(pos(), t) > CHOP_DIST) {
        offWp = true;
        if (!walkTo(t, true, CHOP_DIST)) {
            log(`Ke stromu (${t.x}, ${t.y}) se nedá dojít, přeskakuji.`);
            done.add(K(t.x, t.y));
            return;
        }
    }
    for (let i = 0; i < MAX_STRIKES_PER_TREE; i++) {
        checkSafety();
        if (!findHatchet()) throw 'NOTOOL';
        if (tooHeavy()) throw 'HEAVY';
        const r = strikeTree(t);
        if (r === 'notool') throw 'NOTOOL';
        if (r === 'heavy') throw 'HEAVY';
        if (r === 'empty' || r === 'wrong' || r === 'timeout') break;
    }
    done.add(K(t.x, t.y));
}

// Vysekat všechny stromy kolem bodu č. i (vždy nejbližší další)
function chopAround(i: number) {
    let left = treesAround(WP[i]).filter(t => !done.has(K(t.x, t.y)));
    if (left.length > 0) log(`Bod ${i + 1}/${WP.length}: ${left.length} stromů.`);
    while (left.length > 0) {
        left.sort((a, b) => dist(pos(), a) - dist(pos(), b));
        chopTree(left[0]);
        left = left.filter(t => !done.has(K(t.x, t.y)));
    }
    if (offWp) {
        if (!walkTo(WP[i])) stop(`Nedošel jsem zpět na bod č. ${i + 1}!`);
        offWp = false;
    }
}

// Vrací 'HEAVY' | 'NOTOOL' | 'END' | 'FLEE'
function woodSession(): string {
    try {
        for (let i = resumeWp; i < WP.length; i++) {
            resumeWp = i;
            if (!goToWp(i)) stop(`Nedošel jsem na bod č. ${i + 1} (${WP[i].x}, ${WP[i].y})!`);
            chopAround(i);
        }
        return 'END';
    } catch (e) {
        if (e === 'HEAVY' || e === 'NOTOOL' || e === 'FLEE') return e as string;
        throw e;
    }
}

// ------------------------------ TELEPORTY -----------------------------------

function useRune(): boolean {
    player.use(WOOD_RUNE);
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

function departToWood() {
    if (TRAVEL_MODE === 'walk') departByWalk();
    else departByRune();
}

// Pěšky z domova po HOME_PATH; k prvnímu bodu lesa pak dojde goToWp()
function departByWalk() {
    log('Jdu pěšky do lesa.');
    pathIdx = -1;
    for (let i = 0; i < HOME_PATH.length; i++) {
        if (!walkTo(HOME_PATH[i])) {
            stop(`Nedošel jsem na bod cesty č. ${i + 1} (${HOME_PATH[i].x}, ${HOME_PATH[i].y})!`);
        }
        pathIdx = i;
    }
    pathIdx = NOT_ON_PATH;
    arrival = pos();
    curWp = AT_ARRIVAL;
    offWp = false;
}

function departByRune() {
    for (let a = 1; a <= 3; a++) {
        player.moveItem(WOOD_RUNE, player.backpack);
        sleep(MOVE_DELAY);
        if (!client.findObject(WOOD_RUNE, undefined, player.backpack)) stop('Runa není v batohu!');

        const used = useRune();
        sleep(500);
        openContainer(SECURE_CHEST);
        player.moveItem(WOOD_RUNE, SECURE_CHEST); // runa zpět, teleport mezitím běží
        sleep(MOVE_DELAY);

        if (!used) { alarm('Gump runy se neotevřel, zkouším znovu.', 0x35); continue; }
        if (waitUntil(() => dist(pos(), HOME_START) > 30, TELEPORT_TIMEOUT, null, 1000)) {
            sleep(1500);
            arrival = pos();
            curWp = AT_ARRIVAL;
            offWp = false;
            return;
        }
        alarm('Teleport do lesa neproběhl, zkouším znovu.', 0x35);
    }
    stop('Teleport do lesa opakovaně selhal!');
}

// Při útěku couvá: od stromu zpět na bod, pak po bodech k místu příletu
function fleeTick() {
    if (pathIdx !== NOT_ON_PATH) return; // ještě cestou do lesa – nikam nekráčet
    let t: P;
    if (offWp && curWp >= 0) t = WP[curWp];
    else if (curWp > 0) t = WP[curWp - 1];
    else t = arrival || WP[0];
    if (at(t)) {
        if (offWp) offWp = false;
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

// Pěšky domů: zpět po bodech lesa na první bod, pak HOME_PATH pozpátku.
// Bezpečnostní kontrola je vypnutá – postava už jde domů, útěk nemá kam vést.
function walkHome() {
    log('Jdu pěšky domů.');
    let back: P[];
    if (pathIdx !== NOT_ON_PATH) {
        // útěk ještě cestou do lesa: zpět jen po už ušlé části cesty
        back = HOME_PATH.slice(0, pathIdx + 1).reverse();
        pathIdx = NOT_ON_PATH;
    } else {
        if (curWp !== AT_ARRIVAL && !goToWp(0, false)) stop('Nedošel jsem zpět na první bod lesa!');
        back = [...HOME_PATH].reverse();
    }
    for (let i = 0; i < back.length; i++) {
        if (!walkTo(back[i], false)) stop(`Cestou domů jsem nedošel na bod (${back[i].x}, ${back[i].y})!`);
    }
    if (!walkTo(HOME_START, false)) stop('Nedošel jsem na výchozí místo u truhly!');
    curWp = AT_ARRIVAL;
    offWp = false;
}

function goHome(flee: boolean) {
    if (RETURN_MODE === 'walk') walkHome();
    else travelHome(flee);
}

function flee() {
    alarm(`${fleeReason} – utíkám domů!`);
    goHome(true);
    openContainer(SECURE_CHEST);
    storeLogs();
    stop(`Útěk z lesa (${fleeReason}) – postava je doma. Spusť script znovu, až bude bezpečno.`);
}

// ---------------------------------- DOMA ------------------------------------

function storeLogs() {
    for (const it of items(LOG_GRAPHIC, undefined, player.backpack)) {
        player.moveItem(it, LOG_BAG, undefined, undefined, undefined, it.amount);
        sleep(MOVE_DELAY);
    }
}

function homeService() {
    openContainer(SECURE_CHEST);
    storeLogs();

    const have = countHatchets();
    if (have < HATCHETS_WANTED) {
        openContainer(HATCHET_BAG);
        const src = items(HATCHET_GRAPHIC, undefined, HATCHET_BAG);
        const need = Math.min(HATCHETS_WANTED - have, src.length);
        for (let i = 0; i < need; i++) {
            player.moveItem(src[i], player.backpack);
            sleep(MOVE_DELAY);
        }
    }
    if (countHatchets() === 0) stop('Došly sekery!');
    if (countHatchets() < HATCHETS_WANTED) alarm('Varování: v pytlíku docházejí sekery.', 0x35);

    if (RETURN_MODE === 'nb' && !client.findType(NB_RUNE_GRAPHIC, NB_RUNE_HUE, player.backpack)) {
        stop('NB runa není v batohu!');
    }
}

// ---------------------------------- MAIN ------------------------------------

function main() {
    if (WP.length === 0) stop('Nejsou zadané body lesa (WOOD_WAYPOINTS).');
    if (!at(HOME_START)) stop('Spusť script na výchozím místě u secure truhly.');
    if (TRAVEL_MODE === 'rune' && !WOOD_RUNE) stop('Režim runy: není zadaná WOOD_RUNE.');

    while (true) {
        homeService();
        try {
            departToWood(); // pěšky může cestou narazit na nebezpečí
        } catch (e) {
            if (e === 'FLEE') flee();
            throw e;
        }
        if (DEBUG_TERRAIN) debugTerrain();

        const r = woodSession();
        if (r === 'FLEE') flee();

        // HEAVY, NOTOOL i END: domů a vyložit
        goHome(false);
        if (r === 'END') {
            openContainer(SECURE_CHEST);
            storeLogs();
            stop('Les je vysekaný, hotovo!', 0x44);
        }
    }
}

main();
