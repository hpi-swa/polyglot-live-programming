// <Example :name="ten" n="16" />
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

Polyglot.export('fibonacci', fibonacci);