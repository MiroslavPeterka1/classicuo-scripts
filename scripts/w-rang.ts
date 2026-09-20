const zbraneOstro = [
  0xF4F, // kuše
  0x13FC, // těžká kuše
  0x13B1, // luk
  0x26C3, // repeatin x-bow
  0x1B74, // stit
];

const vRuce = player.equippedItems.twoHanded;
const serialy = [];
const graphics = [];
zbraneOstro.forEach(val => { 
  let zbran = client.findType(val, null, player.backpack);
  if (zbran) { 
    serialy.push(zbran.serial);
    graphics.push(zbran.graphic);
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
