client.sysMsg("Majdi kád");
const kad = target.query();

while (!player.isDead) {
  if (player.mana < 50) {
    const lahev = client.findType(0xF0E, null, player.backpack);
    player.use(kad.serial);
    target.waitTargetEntity(lahev.serial);
    sleep(500);
    const tmr = client.findType(0xF09, 0x3, player.backpack);
    player.use(tmr.serial);
    sleep(200);
  }
  const necroSv = client.findType(0xE35, 0x79, player.backpack);
  player.use(necroSv.serial);
  target.waitTargetSelf();
  sleep(3000);
}
