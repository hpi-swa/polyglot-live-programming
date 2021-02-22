// <Example :name="test_insertionSort2" array="[5,4,2,1]" />
// <Example :name="test_insertionSort" array="[8,5,4,2]" />
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
 