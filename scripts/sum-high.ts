// fill combinations of char + name and script will select higher sum for your char (necro 115% -> wortex, 100% -> skeleton)
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
        exit();
      }
      data.horizontalMenuSelect(0x20E7);
      exit();
    }
  case "mag":
    { 
      const skillHigh = player.getSkill(Skills.Magery).value >= 1150;
      if (skillHigh) { 
        data.horizontalMenuSelect(0x20D6);
        exit();
      }
      data.horizontalMenuSelect(0x20FE);
      exit();
    }
  case "rang":
    { 
      data.horizontalMenuSelect(0x211E);
      exit();
    }
  case "bishop":
    { 
      data.horizontalMenuSelect(0x20A2);
      exit();
    }
  default:
    client.sysMsg("V konfiguraci nenalezena kombinace jméno hráče a char");
}
