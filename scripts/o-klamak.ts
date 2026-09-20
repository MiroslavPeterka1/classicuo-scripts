const klamaci = [
  0x20cf, // Bear
  0x20d0, // Giant Rat
  0x20d1, // Chicken
  0x20d4, // Hind
  0x20d5, // Dog
  0x20db, // Bear
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
  0x2122, // Wolf
  0x2123, // Rat
  0x2124, // Horse
  0x2125, // Rabbit
  0x2130, // Bullfrog
  0x2131, // Alligator
  0x20ee, // Bird
];

player.toggleWarMode();
const klamak = findKlamak();
if (!klamak) {
  client.headMsg(`Nenalezen klamak`, player.serial, 0x25);
  exit("Nejsou klamaci");
}
player.use(klamak.serial);


function findKlamak() { 
  let result;
  for (const klamak of klamaci) { 
    const foundet = client.findType(klamak, null, player.backpack);
    if (foundet) { 
      result = foundet;
      break;
    }
  }
  return result;
}
