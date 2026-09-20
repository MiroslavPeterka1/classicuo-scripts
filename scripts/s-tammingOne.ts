const TAMEABLE_GRAPHICS: number[] = [
  0x20cf, // Bear
  0x20d0, // Giant Rat
  0x20d1, // Chicken
  0x20d4, // Hind
  0x20d5, // Dog
  0x20db, // Bear
  0x20dd, // Horse
  0x20e1, // Polar Bear
  0x20e2, // Rabbit
  0x20e6, // Sheep
  0x20ea, // Wolf
  0x20eb, // Sheep
  0x20ef, // Bull
  0x20f0, // Bull
  0x20f1, // Dolphin
  0x20f5, // Gorilla
  0x20f6, // Llama
  0x20f7, // Cougar
  0x20fc, // Snake
  0x20fe, // Snake
  0x20ff, // Walrus
  0x2101, // Pig
  0x2102, // Panther
  0x2103, // Cow
  0x2108, // Mountain Goat
  0x2118, // Bear
  0x2119, // Big Cat
  0x211a, // Bird
  0x211b, // Cat
  0x211c, // Dog
  0x211d, // Eagle
  0x211e, // Grizzly Bear
  0x211f, // Horse White
  0x2120, // Horse
  0x2121, // Horse Brown
  0x2122, // Wolf
  0x2123, // Rat
  0x2124, // Horse
  0x2125, // Rabbit
  0x2126, // Pack Horse
  0x2127, // Pack Llama
  0x2130, // Bullfrog
  0x2131, // Alligator
  0x2135, // Ostard
  0x2136, // Ostard
  0x2137, // Ostard
  0x20ee, // Bird
];

const HUL = 0x13f4;
const HUL_NENABITA_HUE = 0x076b;
const HUL_NABITA_HUE = 0x096d;

const KAD = 0x1843;
const KAD_HUE = 0x724;

pripravHul();
taming();
tamingLoot();


function pripravHul() {
  let hul = client.findType(HUL);
  if (!hul) {
    client.headMsg(`Nemáš hůl`, player.serial, 0x25);
    exit("Nemáš hůl");
  }

  if (hul.hue === HUL_NABITA_HUE) return;

  const kad = client.findType(KAD, KAD_HUE, player.backpack);
  if (!kad) {
    client.headMsg(`Nemáš káď se shrinkama`, player.serial, 0x25);
    exit("Nemáš káď se shrinkama");
  }
  player.use(hul.serial);
  target.waitTargetEntity(kad.serial);
}

function taming(): void {
  const stopMessages = [
    'byl tamnut a opet propusten',
    'Nemuzes mluvit na zvire, kdyz jsi skryty!',
    'Ale co to delas?',
    'Zviratko bylo shrinknuto',
    'Bez bliz',
    'byl tamnut.',
    'Jsi moc daleko',
    'Toto zvire nelze ochocit.',
    'Zviratko uz ma majitele',
    'Toto zvire nedokazes ochocit',
    'Targeting Cancelled',
  ];
  journal.clear();
  target.cancel();
  target.clearQueue();
  sleep(200);
  const hul = client.findType(HUL, HUL_NABITA_HUE);
  client.sysMsg('Zvol zvire:');
  const zvire = target.query();
  while (!stopMessages.some((msg) => journal.containsText(msg))) {
    player.use(hul.serial);
    target.waitTargetEntity(zvire.serial);
  }
  client.sysMsg("taming ukoncen");
}

function tamingLoot(): void {
  for (const graphic of TAMEABLE_GRAPHICS) {
    // hue "-1" = jakakoliv barva -> v teto API predame undefined
    const pet = client.findType(graphic, undefined, 'world');
    if (pet) {
      player.moveItem(pet, player.backpack);
      client.sysMsg('Zviratko sebrano');
      return;
    }
  }
  client.sysMsg('Zviratko chybi v databazi');
}
