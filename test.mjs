import * as strudel from "@strudel/core";
// import mini from "./strudel/packages/mini/mini.mjs";
import { mini } from "@strudel/mini";
import { controls } from "@strudel/core";
global.note = controls.note;
global.mini = mini.mini;

// process.stdout.write('Hello world');
let se = mini("<0 3> 2 5 <3 7>");
let len = se.queryArc(0, 1).length;
let a = note(mini("60").fast(len)).add(se);
console.log(a.queryArc(0, 1));
// a.pianoroll();
