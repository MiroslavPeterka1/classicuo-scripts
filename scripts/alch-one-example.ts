const mortar = client.findType(0xE9B, 0xB87, player.backpack);
if (!mortar) { 
  client.headMsg(`Nemáš hmoždíř`, player.serial, 0x25);
  exit(`Nemáš hmoždíř`);
}

journal.clear();
player.use(mortar.serial);
const data = Gump.findOrWait(0x2B1);
data.horizontalMenuSelect(0xF09, 0x0);
journal.waitForText("You completed the mixture in the mortar",null , 50000);
const lahve = client.findType(0xF0E, 0x0, player.backpack);
if (!lahve) { 
  client.headMsg(`Nemáš lahve`, player.serial, 0x25);
  exit(`Nemáš lahve`);
}
player.use(mortar.serial);
