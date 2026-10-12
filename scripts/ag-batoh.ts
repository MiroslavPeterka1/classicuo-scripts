// spuštěním se srovnají nb itemy v batohu
const bp = player.backpack;
const bps = bp.serial;

//obecné
const nbMortal = client.findType(0xE9B, 0xB87, bp);
if (nbMortal) player.moveItem(nbMortal.serial, bps, 90, 60);
sleep(500);
const nbRuna = client.findType(0x1F14, 0xB1D, bp);
if (nbRuna) player.moveItem(nbRuna.serial, bps, 100, 60);
sleep(500);
const klice = client.findType(0x176B, 0x0, bp);
if (klice) player.moveItem(klice.serial, bps, 110, 60);
sleep(500);
const nbDrawingKnife = client.findType(0x10E4, 0xB80, bp);
if (nbDrawingKnife) player.moveItem(nbDrawingKnife.serial, bps, 120, 60);
sleep(500);
const tb = client.findType(0x22C5, 0x0, bp);
if (tb) player.moveItem(tb.serial, bps, 130, 60);
sleep(500);
const sb = client.findType(0xEFA, 0xB88, bp);
if (sb) player.moveItem(sb.serial, bps, 145, 60);
sleep(500);

//
