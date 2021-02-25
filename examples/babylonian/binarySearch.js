// <Example :name="BS" key="5" array="[8,3,5,2]" />
function binarySearch(key, array) {

    var low = 0;
    var high = array.length - 1;
    // <Probe :expression="high" />
    while (low <= high) {

        var mid = Math.floor((low + high) / 2);
        // <Probe :expression="mid" />
        var value = array[mid];
        // <Probe :expression="value" />

        if (value < key) {
            // <Probe :expression="low" />
            low = mid + 1;

        }
        else if (value > key) {
            high = mid - 1;

        }
        else {
            return mid;
        }
    }

    return - 1;
}