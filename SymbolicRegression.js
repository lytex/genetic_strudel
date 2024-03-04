var labels = ["ρ", "Δh", "ΔP"];
var ytemp = [
  34.9374375, 60.8034, 28.3177125, 11.032875, 66.19725, 12.7491, 3.3098625,
  18.388125, 7.8456, 12.1361625, 2.206575, 9.561825, 0.245175, 31.87275, 0,
  7.35525, 35.4277875, 7.110075, 39.473175, 18.878475,
];
var Xtemp = [
  [0.95, 3.75],
  [0.8, 7.75],
  [0.55, 5.25],
  [0.25, 4.5],
  [0.9, 7.5],
  [0.4, 3.25],
  [0.15, 2.25],
  [0.75, 2.5],
  [0.2, 4],
  [0.45, 2.75],
  [0.3, 0.75],
  [0.65, 1.5],
  [0.05, 0.5],
  [0.5, 6.5],
  [0, 0.25],
  [0.6, 1.25],
  [0.85, 4.25],
  [0.1, 7.25],
  [0.7, 5.75],
  [0.35, 5.5],
];

String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
        return typeof args[number] != 'undefined' ? args[number] : match;
    });
}

//funções para usar com reduce, map, etc
const maximum = (accumulator, currentValue) => Math.max(accumulator, currentValue);
const minimum = (accumulator, currentValue) => Math.min(accumulator, currentValue);

function zip() {
    var args = [].slice.call(arguments);
    var shortest = args.length==0 ? [] : args.reduce((a,b) => a.length < b.length ? a : b);

    return shortest.map((_,i) => args.map(array => array[i]));
}
const range     = (start, stop, step = 1) => {
    let arr = Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step);

    return arr.length == 0 ? [start] : arr;
}
const prod      = (accumulator, currentValue) => accumulator * currentValue;
const sum       = (accumulator, currentValue) => accumulator + currentValue;
const bestScore = (bestExp, currentExp) => currentExp.score > bestExp.score ? currentExp : bestExp;

var funs = {
    sin  : Math.sin,
    cos  : Math.cos,
    tan  : Math.tan,
    abs  : Math.abs,
    id   : x => x,
    sqrt : x => x<0 ? 0 : Math.sqrt(x),
    exp  : x => x>=300 ? Math.exp(300) : Math.exp(x), //e^x
    log  : x => x<=0 ? 0 : Math.log(x) //ln(x)
}

var funsKeys = Object.keys(funs);

function buildRandIT(nTerms, nvars, expolim){
    return {
        terms  : Array.from({length: nTerms}, createTerm = () => {
            let term = Array.from({length: nvars}, () =>
                Math.random() * 2 * (expolim+1) - 1 - expolim << 0
            );
            return term.every(t => t == 0) ? createTerm() : term;
        }),
        funcs  : Array.from({length: nTerms}, () =>
                     funs[funsKeys[funsKeys.length * Math.random() << 0]]
                 ),
        coeffs : Array(nTerms).fill(1.0),
        length : nTerms
    };
}
    
function buildRootIT(nvars){
    return {
        terms  : Array.from({length: nvars}, (_, termIdx) => 
            Array.from({length: nvars}, (_, tIdx) => termIdx == tIdx ? 1 : 0)
        ),
        funcs  : Array.from({length: nvars}, () => funs['id']),
        coeffs : Array(nvars).fill(1.0),
        length : nvars
    };
}

function composeIT(IT, newTerm){
    IT.terms.push(newTerm.term.slice());
    IT.funcs.push(newTerm.func);
    IT.coeffs.push(('coeff' in newTerm) ? newTerm.coeff : 1.0);
    
    IT.length += 1;

    return IT;
}

function sanitizeIT(IT){
    // limpa o "Lixo" - termos nulos, termos repetidos
    
    let toRemove = [];
    let backup = copyIT(IT);

    IT.terms.forEach(function(term, tIndex, terms){
        if (term.every(t => t == 0))
            toRemove.push(tIndex);
        else
            for (let i=tIndex+1; i<IT.length; i++){
                if (zip(term, terms[i]).every(([t1, t2]) => t1 == t2))
                    if (IT.funcs[tIndex] == IT.funcs[i])
                        toRemove.push(tIndex);
            }
    });

    toRemove.reverse().forEach(function(index){
        IT.terms.splice(index, 1);
        IT.coeffs.splice(index, 1);
        IT.funcs.splice(index, 1);
    });

    IT.length = IT.terms.length;

    return IT.length == 0 ? backup : IT;
}

function evalIT(IT, X){
    return zip(IT.coeffs, IT.funcs, IT.terms).map( function([c, f, term]){
        return c*f(zip(X, term).map(function([x, t]){
            return Math.pow(x, t);
        }).reduce(prod, 1));
    }).reduce(sum, 0);
}

function fitIT(IT, Xs, ys){
    try{
        let ysHat = ys.map(y => [y]);
        let XsHat = Xs.map(function(X){
            return zip(IT.funcs, IT.terms).map(function([f, term]){
                return f(zip(X, term).map(function([x, t]){
                    return Math.pow(x, t);
                }).reduce(prod, 1));
            });
        });
    
        let XsHatT = math.transpose(XsHat);
    
        let q1 = math.inv(math.multiply(XsHatT, XsHat));
        let q2 = math.multiply(XsHatT, ysHat);
        
        let ws = math.multiply(q1, q2);

        IT.coeffs = ws.map(w => w[0]);
    }
    catch(err){ //não foi possível encontrar inversa, coeficientes ficam 1
        //console.log(err);
    }
    
    let MAE = zip(Xs, ys).map(function([X, y]){
        return Math.abs(evalIT(IT, X) - y);
    }).reduce(sum, 0) / Xs.length;

    let score = 1/(1 + MAE);

    IT.score = isFinite(score) ? score : 0.0;

    return IT;
}

function simplifyIT(IT, Xs, ys, nvars, threshold){
    let findCoeffs = (_, index) => Math.abs(IT.coeffs[index]) > threshold;

    let newIT = {
        terms  : IT.terms.filter(findCoeffs).slice(),
        funcs  : IT.funcs.filter(findCoeffs).slice(),
        coeffs : IT.coeffs.filter(findCoeffs).slice(),
        length : IT.coeffs.filter(findCoeffs).length
    };

    return newIT.length == 0 ? IT : (newIT.length == IT.length ? IT : simplifyIT(fitIT(newIT, Xs, ys), Xs, ys, nvars, threshold));
}

function mutateopIT(IT){
    IT.funcs[IT.length * Math.random() << 0] = funs[funsKeys[funsKeys.length * Math.random() << 0]];

    return IT;
}

function mutatetermsIT(IT, nvars, expolim){
    IT.terms[IT.length * Math.random() << 0][nvars * Math.random() << 0] =
        Math.random() * 2 * (expolim+1) - 1 - expolim << 0;

    return IT.terms.some(term => term.every(t => t == 0)) ? buildRandIT(IT.length, nvars, expolim) : IT;
}

function copyIT(IT){
    return newIT = {
        terms  : IT.terms.map(term => term.slice()),
        funcs  : IT.funcs.slice(),
        coeffs : IT.coeffs.slice(),
        length : IT.length,
        score  : IT.score
    };
}

function printIT_debug(IT){
    return zip(IT.coeffs, IT.funcs, IT.terms).map(function([c, f, term]){
        return "{0}*{1}([{2}])".format(c.toFixed(3), f.name, term);
    }).join(' + ');
}

function printIT_html(IT){
    return zip(IT.coeffs, IT.funcs, IT.terms).map(function([c, f, term]){
        let c_str    = c.toFixed(3) == "1.000" ? "" : "{0}*".format(c.toFixed(3));
        let f_str    = f.name == "id" ? "" : f.name;
        let term_str = term.map((t, index) => {
            switch(t){
                case 0  : return;
                case 1  : return "x{0}".format(index);
                default : return "x{0}<sup>{1}</sup>".format(index, t);
            }
        }).filter(Boolean).join(' * ');
        return c_str + f_str + "(" + term_str + ")";
    }).join(' + ');
}

function printIT_latex(IT, join=true){
    let list_of_str = zip(IT.coeffs, IT.funcs, IT.terms).map(function([c, f, term]){
        let nom = [];
        let den = [];

        let c_str  = c.toFixed(3) == "1.000" ? "" : "{0} \\cdot ".format(c.toFixed(3));
        
        term.forEach((t, index) => {
            switch(true){
                case (t==1)  : nom.push("x{0}".format(index)); break; 
                case (t>1)   : nom.push("x{0}^\{{1}\}".format(index, t)); break;
                case (t==-1) : den.push("x{0}".format(index)); break;
                case (t<-1)  : den.push("x{0}^\{{1}\}".format(index, -1*t)); break;
                default      : ;
            }
        });

        nom = nom.filter(Boolean).join(' \\cdot ');
        den = den.filter(Boolean).join(' \\cdot ');
        
        let f_str = function(wrap){
            return f.name == "id" ? wrap : f.name + '(' + wrap + ')';
        };

        switch(true){
            case (nom.length==0 && den.length==0): 
                return ;
            case (nom.length==0): 
                return c_str + f_str("\\frac\{1\}\{{0}\}".format(den));
            case (den.length==0): 
                return c_str + f_str("{0}".format(nom));
            default: 
                return c_str + f_str("\\frac\{{0}\}\{{1}\}".format(nom, den));
        }
    });

    return join ? list_of_str.filter(Boolean).join(' + ') : list_of_str;
}

function ITES(Xs, ys, popSize, selectedSize, minSize, maxSize, expolim, generations, stopScore = 0.99){
    let pop   = [ ];    
    let nvars = Xs[0].length;

    range(minSize, maxSize+1).forEach(function(expSize){
        pop = pop.concat(Array.from({length: Math.round( popSize/(maxSize - minSize + 1) )}, () =>
            fitIT(sanitizeIT(buildRandIT(expSize, nvars, expolim)), Xs, ys )
        ));
    });

    let best = pop.reduce(bestScore);

    range(0, generations).some(function(g) { //'some' para poder interromper caso atinja stopScore

        //Seleção
        let parents = Array.from({length: selectedSize}, () => {
            let exp1 = pop[pop.length * Math.random() << 0];
            let exp2 = pop[pop.length * Math.random() << 0];

            return copyIT(exp1.score > exp2.score ? exp1 : exp2);
        });

        //Mutação
        parents.forEach(function(parentIT, index){
            parents[index] = fitIT(sanitizeIT(
                ( Math.random() > 0.5 ? mutateopIT(parentIT) : mutatetermsIT(parentIT, nvars, expolim) ),
            ), Xs, ys
            );
        });
        
        //Offspring
        pop = Array.from({length: popSize}, () => {
            let exp1 = parents[parents.length * Math.random() << 0];
            let exp2 = parents[parents.length * Math.random() << 0];

            return copyIT(exp1.score > exp2.score ? exp1 : exp2);
        });

        best = pop.reduce(bestScore);

        //Finaliza a evolução caso já tenha encontrado a solução aceitável
        return best.score >= stopScore;
    });

    return simplifyIT(best, Xs, ys, nvars, 0.005);
} 

function ITLS(Xs, ys, popSize, minSize, maxSize, expolim, iterations, stopScore=0.99){
    let pop   = [ ];    
    let nvars = Xs[0].length;

    range(minSize, maxSize+1).forEach(function(expSize){
        pop = pop.concat(Array.from({length: Math.round( popSize/(maxSize - minSize + 1) )}, () =>
            fitIT(sanitizeIT(buildRandIT(expSize, nvars, expolim)), Xs, ys )
        ));
    });

    let best = pop.reduce(bestScore);

    range(0, iterations).some(function(i){   
        let neighbors = Array.from({length: best.length}, (term, termIdx) => //cria mas não fita
            Array.from({length: funsKeys.length}, (_, opIdx) => 
                Array.from({length: nvars}, (t, tIdx) =>
                    Array.from([-1, 0, 1], tIncrement => { //eventualmente o original (best) será criado também - sendo preservado
                        let neighbor = copyIT(best);

                        neighbor.terms[termIdx][tIdx] += tIncrement;
                        neighbor.funcs[termIdx] = funs[funsKeys[opIdx]];
                        
                        return neighbor.terms[termIdx].every(t => t == 0) ? undefined : neighbor;
                    }).filter(Boolean)
                )
            )
        ).flat(4);

        return neighbors.some(function(neigh, _) { //fita um por um, e checa se já encontrou solução aceitável
            best = fitIT(sanitizeIT(neigh), Xs, ys).score > best.score ? neigh : best;
            
            return best.score >= stopScore;
        });
    });

    return simplifyIT(best, Xs, ys, nvars, 0.005);
} 

function SYMTREE(Xs, ys, iterations, threshold, minI, minT, stopScore){

    let nvars  = Xs[0].length;

    let best   = fitIT(buildRootIT(nvars), Xs, ys);
    let leaves = [best];

    range(0, iterations).some(function(i){

        //for leaf in leaves --> expand
        let nodes = leaves.map(function(leaf, _){
            let toExpand = [];
        
            for(let j=0; j<leaf.length; j++){
                for(let k=j; k<leaf.length; k++){
                    toExpand.push({
                        term: zip(leaf.terms[j], leaf.terms[k]).map(function([t1, t2]){
                            return t1 + t2;
                        }),
                        func: funs['id']
                    });
                    if (i>=minI){
                        toExpand.push({
                            term: zip(leaf.terms[j], leaf.terms[k]).map(function([t1, t2]){
                                return t1 - t2;
                            }),
                            func: funs['id']
                        }); 
                    }
                }
                if(i>=minT) {
                    for(let k=0; k<funsKeys.length; k++) {
                        if(funs[funsKeys[k]] != leaf.funcs[j]){
                            toExpand.push({
                                term: leaf.terms[j].slice(),
                                func: funs[funsKeys[k]]
                            });
                        }
                    }                        
                }
            }

            toExpand = toExpand.filter(function(term){
                let attempt = fitIT(sanitizeIT(composeIT(copyIT(leaf), term)), Xs, ys);

                return attempt.score > leaf.score;
            });

            let children = [ ];
    
            while (toExpand.length>0){
                let greedyBest = leaf;
        
                toExpand = toExpand.filter(function(term){    
                    let attempt = fitIT(sanitizeIT(composeIT(copyIT(greedyBest), term)), Xs, ys);

                    if (attempt.score > greedyBest.score){
                        greedyBest = copyIT(attempt);
                        return false;
                    }
                    return true;
                }); //fim da greedy search 

                greedyBest = simplifyIT(greedyBest, Xs, ys, nvars, threshold);
                children.push(greedyBest);
            }
        
            return children.length>0 ? children : [leaf];
        });
        
        leaves = nodes.flat();
        
        return leaves.reduce(bestScore).score >= stopScore;
    });

    return simplifyIT(leaves.reduce(bestScore), Xs, ys, nvars, 0.005);
}

// --------------------------------------------------------------------------
function test_ITES(){
    //(Xs, ys, popSize, selectedSize, minSize, maxSize, expolim, generations, stopScore)
    var symreg = ITES(Xtemp, ytemp, 150, 45, 1, 3, 3, 50, 0.99);
    
    console.log(printIT_debug(symreg));
    console.log(symreg);
}

function test_ITLS(){
    //(Xs, ys, popSize, minSize, maxSize, expolim, iterations, stopScore)
    var symreg = ITLS(Xtemp, ytemp, 150, 1, 3, 3, 50, 0.99);
    
    console.log(printIT_debug(symreg));
    console.log(symreg);
}

function test_SYMTREE(){
    //(Xs, ts, iterations, threshold, minI, minT, stopScore)
    var symreg = SYMTREE(Xtemp, ytemp, 5, 0.05, 2, 2, 0.99);
    
    console.log(printIT_debug(symreg));
    console.log(symreg);
}

test_SYMTREE()
