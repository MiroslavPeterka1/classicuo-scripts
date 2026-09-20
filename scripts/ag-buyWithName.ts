target.cancel();
const vendor = target.query();
const vendorItem = client.findObject(vendor.serial);
player.say(`${vendorItem.name} buy`)
