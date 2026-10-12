// pouze vyhazuje úlovek, truhlu kam chcete dát je třeba otevřít a první dvě proměny naplnit serialama kontejnerů kam chcete přesunout. Vysype ryby zvlášť a lahve zvlášť.

const truhlaNaRyby = 0x4009EB0C;
const batohNaLahve = 0x403AFE8F;

const RYBY: [number, number][] = [
  [0x09cd, 0x0850],
  [0x09cd, 0x0482], // bíla magicka
  [0x09cd, 0x084c], // modra magicka
  [0x097a, 0x0000],
  [0x09cd, 0x0481], // Shamanska vzacna ryba
  [0x09cd, 0x0799], // Shamanska vzacna ryba
  [0x09cd, 0x0b7c], // Shamanska vzacna ryba
];

const lahve = client.findAllOfType(0x099b, 0x08a4, player.backpack);
lahve.forEach(lahev => {
  player.moveItem(lahev.serial, batohNaLahve);
  sleep(500);
});

RYBY.forEach(ryba => {
  const [graphic, hue] = ryba;
  const vBatohu = client.findType(graphic, hue, player.backpack);
  if (vBatohu) player.moveItem(vBatohu.serial, truhlaNaRyby)
  sleep(500);
});
