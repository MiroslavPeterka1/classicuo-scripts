const name = "GS";
const graph = 0xF09;
const hue = 0x0;
const lektvar = client.findType(graph, hue, player.backpack);
if (!lektvar) { 
  client.headMsg(`Došli ${name}`, player.serial, 0x25);
  exit(`Není ${name}`);
}
journal.clear();
player.use(lektvar.serial);
const zbyva = client.findAllItemsOfType(graph, hue, player.backpack);
sleep(100);
if (journal.containsText("You can't drink another potion yet")) {
  client.headMsg(`Nemůžeš ještě pít. Zbývá:  ${zbyva.length}`, player.serial, 0x25);
} else {
  client.headMsg(`Zbýva ${zbyva.length}`, player.serial, 0x63);
}
