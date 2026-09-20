const stity = [
  0x1B78, // cheatDead
  0x1B72, // lastStand
  0x1B76, // anciant
];

const vRuce = player.equippedItems.twoHanded;
const serialy = [];
const graphics = [];
stity.forEach(val => { 
  let stit = client.findType(val, null, player.backpack);
  if (stit) { 
    serialy.push(stit.serial);
    graphics.push(stit.graphic);
    return;
  }
  if (val === vRuce.graphic) { 
    serialy.push(vRuce.serial);
    graphics.push(vRuce.graphic);
    return;
  }
});

if (!vRuce || vRuce.serial === serialy[serialy.length - 1]) {
  player.use(serialy[0]);
  exit();
}

const index = serialy.findIndex(i => i === vRuce.serial);
player.use(serialy[index + 1]);
