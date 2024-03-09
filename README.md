Genetic programming to find strudel code that succinctly expresses a given MIDI pattern

To install `node_modules`

```bash
npm i @strudel/core @strudel/mini --save
```

Run

```bash
python -m pdb ponyge.py --grammar_file strudel.bnf --dataset_train Strudel/Train.txt --min_init_tree_depth 4 --max_init_tree_depth 5 --fitness_function strudel
```
