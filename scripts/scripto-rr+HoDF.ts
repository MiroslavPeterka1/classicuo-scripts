const rangName = [
  "Rami",
];

journal.clear();
const rr = client.findType(0x108A, null, player.backpack);
if (!rr) client.headMsg(`Došli RR`, player.serial, 0x25);
if (rr) player.use(rr.serial);
if (
  journal.containsText("It too soon to use it again!")
  && rangName.findIndex(val => player.name === val) > 0
) {
  const hodf = client.findType(0x136C, 0xB89, player.backpack);
  if (!hodf) client.headMsg(`Došli HoDF`, player.serial, 0x25);
  if (hodf) player.use(hodf.serial);
}
