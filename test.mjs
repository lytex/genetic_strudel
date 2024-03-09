// import mini from "./strudel/packages/mini/mini.mjs";
import { mini } from "@strudel/mini";
import { controls } from "@strudel/core";
import { promises as fs } from "fs";

async function writeToFile(filePath, content) {
  try {
    await fs.writeFile(filePath, content);
    console.log(`File "${filePath}" has been written successfully.`);
  } catch (error) {
    console.error(`Error writing to file "${filePath}":`, error);
  }
}
global.note = controls.note;
global.mini = mini.mini;

function evaluate_mini(mini_code, length) {
  let se = mini(mini_code);
  let len = se.queryArc(0, 1).length;
  let a = note(mini("60").fast(len)).add(se);
  return a.queryArc(0, length).map((x) => `1\t${x.value.note}`);
  // a.pianoroll();
}

let mini_code = "<0 3> 2 5 <3 7>";
writeToFile(
  "PonyGE2/datasets/Strudel/Train.txt",
  "len\tnote\n" + evaluate_mini(mini_code, 4).join("\n")
);
writeToFile(
  "PonyGE2/datasets/Strudel/Test.txt",
  "len\tnote\n" + evaluate_mini(mini_code, 4).join("\n")
);
// console.log(evaluate_mini(mini_code, 4).join("\n"));
