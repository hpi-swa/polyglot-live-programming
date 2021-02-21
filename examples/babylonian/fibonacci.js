// <Example :name="three_2" n="3" />
// <Example :name="four" n="4" />
function fibonacci(n) {
    if (n === 0) {
        return 0;
    } else if (n === 1) {
        return 1;
    } else {
        // <Probe />
        return fibonacci(n - 1) + fibonacci(n - 2);
    } 
}

// <Example :name="three" n="3" />
// <Example :name="five" n="5" />
function fibonacciIterative(n) {
    let x = 0;
    let y = 1;
    while (n-- > 0) {
        // <Probe :expression="x" />
        const z = x + y;
        x = y;
        y = z;
    }
    return x;
}
