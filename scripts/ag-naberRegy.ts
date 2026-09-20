// For necromance you want necro regs as well so add names of your necromancers into necrJmeno array
const rNum = 1000;
const regyTypes = [
  0xF7A, //black perls 
  0xF84, //garlics
  0xF8C, //sulfurous ash
  0xF88, //nightshade
  0xF7B, //blood moss
  0xF8D, //spider silks
  0xF85, //ginsenk
  0xF86, //mandragora roots
];

const necrJmeno = [
  "Ackerman",
];

const nRNum = 20;
const nRegyTypes = [
  0xF82, //dragons blood
  0xF7D, //deamon blood
  0xF80, //deamon bones
  0xF83, //executioners cap
  0xF7C, //bloodspawn
  0xF79, //blackmoor
  0xF7F, //brimstone
  0xF78, //bat wings
  0xEED, //fertile dirt
  0xF7E, //bones
  0xF8F, //volcanic ash
  0xF89, //obsidian
  0xF91, //wyrms hard
  0xF87, //EoN
];

client.sysMsg("Odkud budeme nabírat");
const zPyt = target.query();
sleep(100);
client.sysMsg("Kam je budeme dávat");
const doPyt = target.query();
validateQuery()
presun(regyTypes, rNum);
client.sysMsg("Regy přesunuty");
if (isNecr()) {
  client.sysMsg("Necro regy přesunuty");
  presun(nRegyTypes, nRNum);
}

function validateQuery() { 
  if (!zPyt) {
    client.sysMsg("Nelazene z pytlík");
    exit();
  }
  if (!doPyt) {
  client.sysMsg("Nelazene do pytlík");
  exit();
  }
}

function presun(types: number[], amount: number) {
  types.forEach(rType => {
    const reg = client.findType(rType, null, zPyt.serial);
    if (reg) {
      player.moveItem(reg.serial, doPyt.serial, null, null, null, amount);
      sleep(550);
    }
  });
}

function isNecr() {
  const index = necrJmeno.findIndex(j => player.name === j);
  if (index === -1) return false;
  return true;
}
