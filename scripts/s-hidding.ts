player.toggleWarMode();
player.useSkill(Skills.Hiding);
client.headMsg("1,8 sec", player.serial,0x63);
sleep(800);
client.headMsg("1 sec", player.serial,0x63);
sleep(1000);
client.headMsg('Hiding now!', player.serial,0x63);
