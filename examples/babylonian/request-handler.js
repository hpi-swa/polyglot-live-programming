Polyglot.evalFile("ruby", "babylonian/request-handler-validator.rb");
const validator = Polyglot.import('Validator');

Polyglot.evalFile("R", "babylonian/request-handler-plot-function.r");
const plotFunction = Polyglot.import('plotFunction');

// <Example :name="error" request="new Object({expr: 'freedom(x)'})" />
// <Example :name="sin(x)" request="new Object({expr: 'sin(x)', x1: -4, x2: 4})" />
function handleDrawRequest(request) {
    const expr = request.expr;
    const x1 = request.x1 || -10;
    const x2 = request.x2 || 10;
    // <Probe />
    const errorMsg = validator.validate(expr);
    if (errorMsg.length() === 0) {
        // <Probe />
        return plotFunction(expr, x1, x2);
    } else {
        // <Probe />
        return errorMsg;
    }
} 
