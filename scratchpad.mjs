import { evaluate_mini } from "./evaluate.mjs";

let mini_code = "<0 3> 2 5 <3 7>";
console.log(evaluate_mini(mini_code, 4).join("\n"));
