Polyglot.evalFile("R", "demo/plotFunction.r");
let plotFunction = Polyglot.import('plotFunction');

// <Example :name="eight" n="8" />
function fibonacci(n) {
    let x = 0;
    let y = 1;
    for (let index = 0; index < n; index++) {
        let z = x;
        // <Probe />
        x = y;
        y = z + y;
    }
    // <Assertion :example="eight" :expected="21" />
    return x;
}

// <Example :name="fib" func="fibonacci" start="0" end="20" />
// <Example :name="sin" func="Math.sin" start="-10" end="10" />
function functionToSVG(func, start, end) {
    let data = new Object();
    data.xValues = []; 
    data.yValues = [];
    for (let index = start; index < end; index++) {
        data.xValues.push(index);
        data.yValues.push(func(index)); 
    }
    // <Assertion :expression="data.xValues.length === end - start" />
    return plotFunction(data);
}
