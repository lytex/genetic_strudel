import { mini } from "@strudel/mini";
import { controls } from "@strudel/core";

global.note = controls.note;
global.mini = mini.mini;

export function evaluate_mini(mini_code, length) {
  let se = mini(mini_code);
  let len = se.queryArc(0, 1).length;
  let a = note(mini("60").fast(len)).add(se);
  return a.queryArc(0, length).map((x) => `${x.value.note}`);
  // a.pianoroll();
}
// console.log(evaluate_mini(mini_code, 4).join("\n"));
