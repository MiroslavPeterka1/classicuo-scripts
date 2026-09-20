// same script for blody bandages for wamp. Just add name of your wamp into array.
const wampJmena = [
  "Pepik"
];
const userName = player.name;
if (wampJmena.find(name => name === userName)) {
  const bandy1 = client.findType(0xE20, 0x0, player.backpack);
  if (bandy1) {
    player.use(bandy1.serial);
    exit();
  }
  const bandy2 = client.findType(0xE22, 0x0, player.backpack);
  if (bandy2) {
    player.use(bandy2.serial);
    exit();
  }
  client.headMsg(`Nenalezeny krvavé bandy`, player.serial, 0x25);
  exit("Nenalezeny krvavé bandy");
} else {
  const salatek = client.findType(0x9EC, 0x6AB, player.backpack);
  if (salatek) {
    player.use(salatek.serial);
    exit();
  } 
  client.headMsg(`Nenalezeny saláty`, player.serial, 0x25);
  exit("Nenalezeny saláty");
}
