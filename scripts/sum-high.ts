type Char = "necro" | "mag" | "rang" | "monk" | "bishop";

const charDefs: { char: Char, name: string }[] = [
  { char: "necro", name: "Ackerman" },
  { char: "mag", name: "Pan Ackerman" },
  { char: "rang", name: "Rami" },
  { char: "bishop", name: "Acker"},
];

const name = player.name;
const char = charDefs.find(charDef => name === charDef.name);

player.cast(Spells.SummonCreature);
const data = Gump.findOrWait(0x2B2);
switch (char.char) {
  case "necro":
    { 
      const skillHigh = player.getSkill(Skills.Necromancy).value >= 1150;
      if (skillHigh) { 
        data.horizontalMenuSelect(0x20ED);
      } else {
        data.horizontalMenuSelect(0x20E7);
      }
      break;
    }
  case "mag":
    { 
      const skillHigh = player.getSkill(Skills.Magery).value >= 1150;
      if (skillHigh) {
        data.horizontalMenuSelect(0x20D6);
      } else { 
        data.horizontalMenuSelect(0x20FE);
      }
      break;
    }
  case "rang":
    { 
      data.horizontalMenuSelect(0x211E);
      break;
    }
  case "bishop":
    { 
      data.horizontalMenuSelect(0x20A2);
      break;
    }
  default:
    client.sysMsg("V konfiguraci nenalezena kombinace jméno hráče a char");
}
