const nbRuna = client.findType(0x1F14, 0xB1D, player.backpack);
if (!nbRuna) exit("NB runa nenalezena");
player.use(nbRuna.serial);
const gump = Gump.findOrWait(0x80A003FD, 1000); 
if (!gump) {
  exit("Neotevřelo se menu");
}
client.headMsg("Port domu ted!", player.serial,0x63)
gump.reply(1);
