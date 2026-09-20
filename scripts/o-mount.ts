// if missing add graphicx
const mounts = [
  0xCC,
  0xE2,
];

if (player.equippedItems.mount) {
  player.use(player.serial)
} else {
  const mount = findMount();
  if (mount) {
    player.use(mount.serial);
  } else {
    exit("Mount not found");
  }
}

function findMount() { 
  let result;
  for (const mount of mounts) { 
    result = client.findType(mount);
    if (result) break;
  }
  return result;
}
