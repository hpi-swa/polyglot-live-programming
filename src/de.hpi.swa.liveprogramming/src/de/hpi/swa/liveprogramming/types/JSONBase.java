/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming.types;

import com.oracle.truffle.tools.utils.json.JSONObject;

public abstract class JSONBase {

    final JSONObject jsonData;

    JSONBase(JSONObject jsonData) {
        this.jsonData = jsonData;
    }
}
