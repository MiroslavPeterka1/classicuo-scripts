// stačí naskočit na loď a pustit. Scritp by měl sám lovit, davat vlasce a posouvat loď v přímém směru a vylovit v celém okolí

const PRUT = 0x0dbf;          // fishing pole
const RADIUS = 6;             // -6..6 kolem hrace
const TIMEOUT_JOURNAL = 10000;
const POSUN_POLI = 13;

// [graphic, hue] – stejne poradi jako ryba[] / cryba[] v puvodnim skriptu
const RYBY_CHCI: [number, number][] = [
  [0x09cd, 0x0850],
  [0x09cd, 0x0482], // bíla magicka
  [0x09cd, 0x084c], // modra magicka
  [0x099b, 0x08a4], // lahev
  [0x097a, 0x0000],
  [0x09cd, 0x0481], // Shamanska vzacna ryba
  [0x09cd, 0x0799], // Shamanska vzacna ryba
  [0x09cd, 0x0b7c], // Shamanska vzacna ryba
];

const RYBY_NECHCI: [number, number][] = [
  [0x09cd, 0x0000], //zluta obyc
  [0x09ce, 0x0000], //fialova obyc
  [0x09cc, 0x0000], //zelena obyc
  [0x09cf, 0x0000], //oranzova obyc
];

const ODPOVEDI = ['no fish here', 'location', 'far away', 'in water', 'You pull', 'You fish a while'];

// ---------- start ----------
startValidation();
while (!player.isDead && masVlasce()) {
  for (let x = -RADIUS; x <= RADIUS; x++) {
    for (let y = -RADIUS; y <= RADIUS; y++) {
      let odpoved: string | null;

      do {
        if (player.isDead) exit();

        journal.clear();
        client.headMsg(`Chytam na ${x}, ${y}`, player, 0x0035);
        player.useType(PRUT);
        target.wait(2000);
        target.terrainWithOffset(x, y, 0);
        odpoved = journal.waitForTextAny(ODPOVEDI, undefined, TIMEOUT_JOURNAL);
        sbirejUlovky();
        zahodRyby();
      } while (odpoved === 'You pull' || odpoved === 'You fish a while');
    }
  }

  client.headMsg(' Vychytano!', player, 0x0044);

  posunLod();
  
}
// ---------- pomocne funkce ----------
function startValidation() {
  if (!mamPrut()) {
    client.headMsg('Nemas prut!', player, 0x0021);
    exit();
  }
}

function masVlasce() { 
  const vlasce = client.findType(0xFA0, 0x2B3, player.backpack);
  return !!vlasce;
}

function vzdalenost(e: { x: number; y: number }): number {
  return Math.max(Math.abs(e.x - player.x), Math.abs(e.y - player.y));
}

// Predmety na zemi s danym graphicem a hue do vzdalenosti 1
function najdiNaZemi(graphic: number, hue: number): Item[] {
  const items = client.findAllItemsOfType(graphic, undefined, 'world') || [];
  return items.filter((i) => i && i.hue === hue && i.x !== 0 && vzdalenost(i) < 2);
}

function mamPrut(): boolean {
  const vRuce = player.equippedItems.twoHanded || player.equippedItems.oneHanded;
  if (vRuce && vRuce.graphic === PRUT) return true;
  return !!client.findType(PRUT, undefined, player.backpack);
}

function sbirejUlovky() {
  const cil = player.backpack;
  RYBY_CHCI.forEach(ryba => { 
    const [graphic, hue] = ryba;
    const zemRyby = najdiNaZemi(graphic, hue);
    if (zemRyby) { 
      zemRyby.forEach(zemRyba => { 
        player.moveItem(zemRyba.serial, cil, null, null, null, zemRyba.amount);
        sleep(500);
      });
    } 
  });
}

function zahodRyby() {
  RYBY_NECHCI.forEach(ryba => { 
    const [graphic, hue] = ryba;
    const batohRyby = client.findAllOfType(graphic, hue, player.backpack);
    if (batohRyby) { 
      batohRyby.forEach(batohRyba => {
        const rybaZem = najdiNaZemi(batohRyba.graphic, batohRyba.hue);
        if (rybaZem.length > 0) {
          player.moveItem(batohRyba.serial, rybaZem[0].serial);
        } else { 
          player.moveItemOnGroundOffset(batohRyba.serial);
        }
        sleep(500);
      });
    } 
  });
}

function posunLod(): boolean {
  const startX = player.x;
  const startY = player.y;
  const TIMEOUT_STOJI = 5000; // jak dlouho muze lod stat, nez to vzdame
 
  client.headMsg(`Posouvam lod o ${POSUN_POLI} poli dopredu`, player, 0x0035);
  player.say('forward');
 
  let posledniX = player.x;
  let posledniY = player.y;
  let stoji = 0;
 
  while (true) {
    if (player.isDead) {
      player.say('stop');
      exit();
    }
 
    sleep(50);
 
    const ujeto = Math.max(Math.abs(player.x - startX), Math.abs(player.y - startY));
    if (ujeto >= POSUN_POLI) break;
 
    if (player.x === posledniX && player.y === posledniY) {
      stoji += 50;
      if (stoji >= TIMEOUT_STOJI) {
        player.say('stop');
        client.headMsg(`Lod se nehybe (ujeto ${ujeto}/${POSUN_POLI})!`, player, 0x0021);
        return false;
      }
    } else {
      posledniX = player.x;
      posledniY = player.y;
      stoji = 0;
    }
  }
 
  player.say('stop');
  sleep(1500); // at se lod zastavi, nez se zacne chytat
  return true;
}
