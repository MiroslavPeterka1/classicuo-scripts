const blanky = client.findType(0xE34, 0x0, player.backpack);
if (!blanky) { 
  client.headMsg(`Nemáš blanky`, player.serial, 0x25);
  exit(`Nemáš blanky`);
}
player.use(blanky.serial);
const data1 = Gump.findOrWait(0x2B2);
data1.horizontalMenuSelect(0x20C6);
const data2 = Gump.findOrWait(0x2B2);
data2.horizontalMenuSelect(0x20B1);
