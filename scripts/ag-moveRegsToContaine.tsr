const lootTypes = [
  0xF7A, //black perls 
  0xF84, //garlics
  0xF8C, //sulfurous ash
  0xF88, //nightshade
  0xF7B, //blood moss
  0xF8D, //spider silks
  0xF85, //ginsenk
  0xF86, //mandragora roots
  0xEED, //gold
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

const bp = player.backpack;
const pytlik = target.query();

if (!pytlik) exit("Pytlík nenalezen");

lootTypes.forEach(lootT => {
  const items = client.findAllOfType(lootT, null, player.backpack);
  items.forEach(item => { 
    player.moveItem(item.serial, pytlik.serial)
    sleep(550);
  });
});
client.sysMsg("Přesunotu");
