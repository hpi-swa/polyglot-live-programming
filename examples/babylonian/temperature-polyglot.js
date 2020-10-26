const API_URL = 'http://api.openweathermap.org/data/2.5/weather';
const TOKEN = '8e50cdb0ea4d86a9058259ff33811adf';
Polyglot.evalFile('ruby', 'babylonian/temperature-polyglot-render.rb');
const renderFunction = Polyglot.import('renderFunction');

// <Example :name="London" city="'London'" />
// <Example city="'San Francisco'" />
function getTemperatureText(city) {
    // <Probe :expression="city" />
    data = JSON.parse(Polyglot.eval('ruby', `require "open-uri";
        open("${API_URL}?q=${city}&units=imperial&appid=${TOKEN}", &:read)`));
    // <Assertion :example="London" :expression="data['sys']['country'] === 'GB'" />
    return renderFunction(city, data['main']['temp']);
}
 