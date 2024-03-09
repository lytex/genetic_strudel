Genetic programming to find strudel code that succinctly expresses a given MIDI pattern

To install `node_modules`

```bash
npm i @strudel/core @strudel/mini --save
pip install -r PonyGE2/requirements.txt
cd PonyGE2
git submodule init && git submodule update
```

Run

```bash
node test.mjs # Generates PonyGE2/datasets/Strudel/Train.txt
cd PonyGE2/src
python ponyge.py --grammar_file strudel.bnf --dataset_train Strudel/Train.txt --min_init_tree_depth 6 --max_init_tree_depth 12 --fitness_function strudel
```
