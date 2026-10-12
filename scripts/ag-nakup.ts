// po spuštění naskočí target, označíš postavu a vysledek je že řekneš jmeno a buy

const vendor = target.query();
const vendorItem = client.findObject(vendor.serial);
player.say(`${vendorItem.name} buy`)
