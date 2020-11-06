/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming.types;

import com.oracle.truffle.api.interop.InteropLibrary;
import com.oracle.truffle.api.interop.InvalidArrayIndexException;
import com.oracle.truffle.api.interop.UnknownIdentifierException;
import com.oracle.truffle.api.interop.UnsupportedMessageException;
import com.oracle.truffle.tools.utils.json.JSONArray;
import com.oracle.truffle.tools.utils.json.JSONException;
import com.oracle.truffle.tools.utils.json.JSONObject;

public class ObjectInformation extends JSONBase {

    ObjectInformation(JSONObject jsonData) {
        super(jsonData);
    }

    public JSONObject getJSON() {
        return jsonData;
    }

    public static ObjectInformation create(String expression, Object result) {
        return create(expression, result, null);
    }

    public static ObjectInformation create(String expression, Object result, String error) {
        final JSONObject json = new JSONObject();
        InteropLibrary lib = InteropLibrary.getUncached();
        String displayString = "displayStringError";
        try {
            json.put("expression", expression);
            displayString = lib.asString(lib.toDisplayString(result));
            json.put("displayString", displayString);
            json.put("interopProperties", getInteropProperties(lib, result));
            if (lib.hasMetaObject(result)) {
                Object metaObject = lib.getMetaObject(result);
                json.put("metaQualifiedName", lib.getMetaQualifiedName(metaObject));
                json.put("metaSimpleName", lib.getMetaSimpleName(metaObject));
            }
            if (lib.hasMembers(result)) {
                JSONArray memberNames = new JSONArray();
                JSONArray memberStrings = new JSONArray();
                Object membersObj = lib.getMembers(result);
                long membersArraySize = lib.getArraySize(membersObj);
                for (int i = 0; i < membersArraySize; i++) {
                    String memberName = lib.asString(lib.readArrayElement(membersObj, i));
                    if (lib.isMemberReadable(result, memberName)) {
                        memberNames.put(memberName);
                        memberStrings.put(lib.toDisplayString(lib.readMember(result, memberName)));
                    }
                }
                json.put("memberNames", memberNames);
                json.put("memberDisplayStrings", memberStrings);
            }
            if (lib.hasArrayElements(result)) {
                JSONArray elements = new JSONArray();
                long arraySize = lib.getArraySize(result);
                for (int i = 0; i < arraySize; i++) {
                    elements.put(lib.asString(lib.toDisplayString(lib.readArrayElement(result, i))));
                }
                json.put("elements", elements);
            }
        } catch (JSONException | UnsupportedMessageException | InvalidArrayIndexException | UnknownIdentifierException e) {
            return createError(expression, displayString, e.getMessage());
        }
        if (error != null) {
            json.put("error", error);
        }
        return new ObjectInformation(json);
    }

    private static JSONArray getInteropProperties(InteropLibrary lib, Object value) {
        JSONArray interopProperties = new JSONArray();
        // Object Types
        if (lib.isBoolean(value)) {
            interopProperties.put("boolean");
        }
        if (lib.isDate(value)) {
            interopProperties.put("date");
        }
        if (lib.isDuration(value)) {
            interopProperties.put("duration");
        }
        if (lib.isException(value)) {
            interopProperties.put("exception");
        }
        if (lib.isInstant(value)) {
            interopProperties.put("instant");
        }
        if (lib.isMetaObject(value)) {
            interopProperties.put("metaObject");
        }
        if (lib.isNull(value)) {
            interopProperties.put("null");
        }
        if (lib.isNumber(value)) {
            interopProperties.put("number");
        }
        if (lib.isPointer(value)) {
            interopProperties.put("pointer");
        }
        if (lib.isString(value)) {
            interopProperties.put("string");
        }
        if (lib.isTime(value)) {
            interopProperties.put("time");
        }
        if (lib.isTimeZone(value)) {
            interopProperties.put("timezone");
        }
        // Object Behavior
        if (lib.isExecutable(value)) {
            interopProperties.put("executable");
        }
        if (lib.isInstantiable(value)) {
            interopProperties.put("instantiable");
        }
        return interopProperties;
    }

    public static ObjectInformation createError(String expression, String displayString, String message) {
        final JSONObject json = new JSONObject();
        json.put("expression", expression);
        json.put("displayString", displayString);
        json.put("interopProperties", new JSONArray());
        json.put("error", message);
        return new ObjectInformation(json);
    }
}
