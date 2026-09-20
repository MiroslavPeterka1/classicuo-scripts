const bandy = client.findType(0xE21, 0x0, player.backpack);
if (!bandy) {
  client.headMsg("Došli bandy", player.serial,0x63);
} else { 
  client.sysMsg(`${player.hits} / ${player.maxHits} Hp`,0x63);
  if (player.hits === player.maxHits) {
    client.headMsg(`Plně vyléčen. Zbývá band: ${bandy.amount}`,player.serial ,0x63);
    if (player.isPoisoned) {
      player.use(bandy.serial);
      target.waitTargetSelf();
      client.headMsg("Jed vyléčen", player.serial, 0x63);
    }
  } else { 
    player.use(bandy.serial);
    target.waitTargetSelf();
    sleep(2750);
    client.headMsg(`${player.hits} / ${player.maxHits} Hp. Zbývá band: ${bandy.amount}`,player.serial,0x63);
  }
}

