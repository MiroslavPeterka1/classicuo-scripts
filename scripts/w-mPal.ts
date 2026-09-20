const zbrane = [
  { graph: 0xF4D, hue: 0x50A }, // barda
  { graph: 0x13B9, hue: 0x50A }, // viking
  { graph: 0x1B74, hue: 0xBAC }, // stit
];
const barda = client.findType(zbrane[0].graph,zbrane[0].hue, player.backpack);
const viking = client.findType(zbrane[1].graph,zbrane[1].hue, player.backpack);
const stit = client.findType(zbrane[2].graph,zbrane[2].hue, player.backpack);

if (barda) {
  player.use(barda.serial);
} else { 
  if (viking) player.use(viking.serial);
  if (stit) player.use(stit.serial);
}
 


