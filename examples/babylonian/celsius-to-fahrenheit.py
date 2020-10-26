# <Example :name="cold" celsius="-10" />
# <Example :name="warm" celsius="30" />
def celsiusToFahrenheit(celsius):
    # <Probe :expression="[celsius] * 2" />
    # <Assertion :example="warm" :expression="result == 86" />
    result = celsius * 9/5 + 32
    return result
