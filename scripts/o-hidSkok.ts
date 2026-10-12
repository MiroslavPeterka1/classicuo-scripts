//udělá krok těsně před tím, než hidne a to ve směru, v jakém je postava natočena

player.toggleWarMode();
player.useSkill(Skills.Hiding);
client.headMsg("1,8 sec", player.serial,0x63);
sleep(800);
client.headMsg("1 sec - Připrav se", player.serial,0x63);
sleep(1000);
client.headMsg('Teď', player.serial,0x63);
player.walk(player.direction);
