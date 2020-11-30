/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */

'use strict';

const textArea: string = 'webViewText';
let slider: HTMLElement = document.getElementById("rangeSlider")!;
let observedValues: Array<string> = [];
let observedProbes: Array<string> = [];
let activeOutput: string;
let overallResult: string;
let lineIndex: any;


window.addEventListener('message', event => {
    const message = event.data;
    if (message.result) {
        handleResult(message.result);
        if (observedValues[0] && observedProbes[0]) {
            updateTextArea('Intermediate Result: ' + observedValues[0] + '<br>' + 'Probe: ' + observedProbes[0]);
        }
    }
});

slider.oninput = function () {
    let probeOutput = 'Probe: ' + observedProbes[parseInt(this.value)];
    let intermediateResult = 'Intermediate Result: ' + observedValues[parseInt(this.value)];
    activeOutput = intermediateResult.concat('<br>').concat(probeOutput);
    updateTextArea(activeOutput);
};

function updateTextArea(text: string) {
    let content: string = 'Overall Result: ' + overallResult + '<br>' + text;
    document.getElementById(textArea)!.innerHTML = content;
}

function handleResult(result: any) {

    for (const probe of result) {
        if (probe.probeType === 'EXAMPLE') {
            handleExample(probe);
        }
        if (probe.probeType === 'PROBE') {
            handleProbe(probe);
        }
    }
}

function handleExample(probe: any) {
    overallResult = probe.examples[0].observedValues[0].displayString;
}

function handleProbe(probe: any) {
    if (!lineIndex) {
        lineIndex = probe.lineIndex;
    }
    for (const example of probe.examples) {
        if (probe.lineIndex === lineIndex) {
            if (example.observedValues) {
                proceedObservedValues(example, observedValues);
            }
        } else {
            proceedObservedValues(example, observedProbes);
        }
    }
}

function proceedObservedValues(example: any, pushToArray: Array<string>) {
    if (example.observedValues.length > 1) {
        let observedValue;
        for (observedValue of example.observedValues) {
            pushToArray.push(observedValue.displayString);
        }
    } else {
        pushToArray.push(example.observedValues[0].displayString);
    }
}