// <Example :name="four" n="4" />
// <Example :name="three" n="3" />
// <Example :name="five" n="5" />
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

// <Example :name="six" n="6" />
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


// <Example :name="five" n="5" />
function fibonacci2(n) {
    if (n === 0) {
        return 0;
    } else if (n === 1) {
        return 1;
    } else {
        // <Probe />
        return fibonacci(n - 1) + fibonacci(n - 2);
    } 
}

// <Example :name="six" n="6" />
function fibonacciIterative2(n) {
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


// <Example :name="five" n="5" />
function fibonacci3(n) {
    if (n === 0) {
        return 0;
    } else if (n === 1) {
        return 1;
    } else {
        // <Probe />
        return fibonacci(n - 1) + fibonacci(n - 2);
    } 
}

// <Example :name="six" n="6" />
function fibonacciIterative3(n) {
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
