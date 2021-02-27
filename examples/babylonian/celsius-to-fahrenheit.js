// <Example :name="warm" celsius="30" />
// <Example :name="very cold" celsius="-30" />
// <Example :name="cold" celsius="-10" />
function celsiusToFahrenheit(celsius) {
    // <Probe :expression="celsius * Math.random()" />
    // <Assertion :expression="2 == 1 + 1" />
    // <Assertion :example="cold" :expected="14" />
    return celsius * 9/5 + 32;
}
