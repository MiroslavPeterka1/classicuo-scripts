target.cancel();
const truhla = target.query();
const truhlaItem = client.findObject(truhla.serial);
journal.clear();
while (!journal.containsText("This item cannot be lockpicked !")) { 
  const locky = client.findType(0x14FB, null, player.backpack);
  if (locky) {
    journal.clear();
    player.use(locky.serial);
    target.waitTargetEntity(truhlaItem);
    sleep(2500);
  } else { 
    client.headMsg("Došli locky", player.serial);
    exit();
  }
}
client.headMsg("Otevřeno", player.serial);
