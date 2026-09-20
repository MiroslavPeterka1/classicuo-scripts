const name = "GS";
const graph = 0x1843;
const hue = 0x481;

const kad = client.findType(graph, hue, player.backpack);
if (!kad) { 
  client.headMsg(`Nemáš káď na ${name}`, player.serial, 0x25);
  exit(`Není káď na ${name}`);
}
const lahve = client.findType(0xF0E, 0x0, player.backpack);
if (!lahve) { 
  client.headMsg(`Nemáš lahve`, player.serial, 0x25);
  exit(`Nemáš lahve`);
}
player.use(kad.serial);
target.waitTargetEntity(lahve.serial);
