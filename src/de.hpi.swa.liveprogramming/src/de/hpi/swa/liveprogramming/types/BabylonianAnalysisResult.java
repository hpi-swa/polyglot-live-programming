/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming.types;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;

import com.oracle.truffle.tools.utils.json.JSONArray;
import com.oracle.truffle.tools.utils.json.JSONObject;

public class BabylonianAnalysisResult {
    HashMap<URI, BabylonianAnalysisFileResult> files = new HashMap<>();

    public BabylonianAnalysisFileResult getOrCreateFile(URI uri, String languageId) {
        return files.computeIfAbsent(uri, u -> new BabylonianAnalysisFileResult(u, languageId));
    }

    public JSONObject toJSON() {
        JSONObject json = new JSONObject();
        JSONArray filesJSON = new JSONArray();
        for (BabylonianAnalysisFileResult file : files.values()) {
            filesJSON.put(file.toJSON());
        }
        json.put("files", filesJSON);
        return json;
    }

    public static class BabylonianAnalysisTerminationResult {
        public static JSONObject create(long startMillis, String error) {
            JSONObject json = new JSONObject();
            json.put("timeToRunMillis", System.currentTimeMillis() - startMillis);
            if (error != null) {
                json.put("error", error);
            }
            return json;
        }
    }

    public static class BabylonianAnalysisFileResult {
        private final URI uri;
        private final String languageId;
        HashMap<Integer, BabylonianAnalysisLineResult> lines = new HashMap<>();

        public BabylonianAnalysisFileResult(URI uri, String languageId) {
            this.uri = uri;
            this.languageId = languageId;
        }

        private JSONObject toJSON() {
            JSONObject json = new JSONObject();
            json.put("uri", uri.toString());
            json.put("languageId", languageId);
            JSONArray linesJSON = new JSONArray();
            for (BabylonianAnalysisLineResult line : lines.values()) {
                linesJSON.put(line.toJSON());
            }
            json.put("lines", linesJSON);
            return json;
        }

        public BabylonianAnalysisLineResult getOrCreateLineResult(int triggerLine) {
            return lines.computeIfAbsent(triggerLine, l -> new BabylonianAnalysisLineResult(l));
        }
    }

    public static class BabylonianAnalysisLineResult {
        private final int lineNumber;
        private final HashMap<String, ProbeResult> probes = new HashMap<>();

        public BabylonianAnalysisLineResult(int lineNumber) {
            assert lineNumber > 0 : "lineNumber out of range";
            this.lineNumber = lineNumber;
        }

        public void recordObservedValue(String exampleName, ProbeType probeType, ObjectInformation objectInformation) {
            probes.computeIfAbsent(exampleName, name -> new ProbeResult(probeType, name)).addObservedValue(objectInformation);
        }

        private JSONObject toJSON() {
            JSONObject json = new JSONObject();
            json.put("lineIndex", lineNumber - 1);
            JSONArray probesJSON = new JSONArray();
            for (ProbeResult probe : probes.values()) {
                probesJSON.put(probe.toJSON());
            }
            json.put("probes", probesJSON);
            return json;
        }
    }

    public static class ProbeResult {
        private final ProbeType probeType;
        private final String exampleName;
        private final ArrayList<ObjectInformation> observedValues = new ArrayList<>();

        public ProbeResult(ProbeType probeType, String exampleName) {
            this.probeType = probeType;
            this.exampleName = exampleName;
        }

        private void addObservedValue(ObjectInformation info) {
            observedValues.add(info);
        }

        private JSONObject toJSON() {
            JSONObject json = new JSONObject();
            json.put("probeType", probeType);
            json.put("exampleName", exampleName);
            JSONArray observedValuesJSON = new JSONArray();
            for (ObjectInformation value : observedValues) {
                observedValuesJSON.put(value.getJSON());
            }
            json.put("observedValues", observedValuesJSON);
            return json;
        }
    }

    public enum ProbeType {
        EXAMPLE,
        PROBE,
        ASSERTION,
        REPLACEMENT
    }
}
