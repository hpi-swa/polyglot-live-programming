// <Example array="[6, 1, 4, 2]" />
function insertionSort(array) {
    for (let i = 1; i < array.length; i++) {
        // <Probe :expression="array" />
        const x = array[i];
        let j = i - 1;
        while(j >= 0 && array[j] > x) {
            // <Probe />
            array[j + 1] = array[j];
            j--;
        }
        array[j + 1] = x;
    }
    return array;
}
 