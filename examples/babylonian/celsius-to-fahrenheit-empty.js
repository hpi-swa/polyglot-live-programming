// <Example :name="cold" celsius="-10" />
// <Example :name="warm" celsius="30" />
function celsiusToFahrenheit(celsius) {
    // <Probe :expression="2 * Math.random()" />
    // <Assertion :example="warm" :expected="86" />
    return celsius * 9/5 + 32;
}
