require 'erb'

# <Example :name="Berlin" city="'Berlin'" fahrenheit="60" />
def renderFunction(city, fahrenheit)
    # <Probe />
    celsius = ((fahrenheit - 32) * 5/9).round;
    # <Probe :example="Berlin" :expression="fahrenheit + not_defined" />
    ERB.new("<%= city %>: <%= celsius %>°C / <%= fahrenheit %>°F").result(binding)
end

Polyglot.export_method :renderFunction