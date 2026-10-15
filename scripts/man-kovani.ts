client.sysMsg("Napis 'krump' nebo 'sekera'");
// const vyrSerial = 0xE85; // krump
const vyrSerial = 0xF43; // sekera
client.sysMsg("Nalezeno: " + vyrSerial);
client.sysMsg("Vyber container se zelezem");
const zelezoPyt = target.query();
client.sysMsg("Vyber container se drevem");
const drevoPyt = target.query();
client.sysMsg("Vyber kam dávat výrobky");
const vyrobekPyt = target.query();

let zelezo;
let drevo;

while (!player.isDead && najdiSuroviny()) { 
  player.moveItem(zelezo.serial, player.backpack, null, null, null, 40);
  sleep(500);
  player.moveItem(drevo.serial, player.backpack, null, null, null, 10);
  sleep(500);

  for (let i = 0; i < 10; i++) {
    const zelezoBatho = client.findType(0x1BEF, 0x0, player.backpack);
    player.use(zelezoBatho.serial);
    sleep(200);
    const data1 = Gump.findOrWait(0x2B2);
    data1.horizontalMenuSelect(0x13E3);
    sleep(100);
    const data2 = Gump.findOrWait(0x2B2);
    data2.horizontalMenuSelect(vyrSerial);
    sleep(4500);
  }
  const vyrobky = client.findAllOfType(vyrSerial, null, player.backpack);
  vyrobky.forEach(vyrobek => {
    player.moveItem(vyrobek.serial, vyrobekPyt.serial);
    sleep(1000);
  });
  sleep(500);
}

function najdiSuroviny() {
  zelezo = null;
  drevo = null;

  zelezo = client.findType(0x1BEF, 0x0, zelezoPyt.serial);
  if (!zelezo) {
    client.sysMsg("Není železo");
    exit();
  }
  drevo = client.findType(0x1BDD, 0x0, drevoPyt.serial);
  if (!drevo) {
    client.sysMsg("Není drevo");
    exit();
  }
  return true;
}
