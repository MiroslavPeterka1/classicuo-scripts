//pokud más kad, pouzeje kad, pokud ne, tak caruje

const kadNaSvetlo = client.findType(0x1843, 0x3C4, player.backpack);
if (!!kadNaSvetlo) {
  player.use(kadNaSvetlo.serial);
  target.waitTargetSelf();
} else { 
  player.cast(Spells.NightSight);
  target.waitTargetSelf();
}
