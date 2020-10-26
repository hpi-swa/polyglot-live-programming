/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming.types;

import java.net.URI;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import com.oracle.truffle.api.instrumentation.SourceSectionFilter;
import com.oracle.truffle.api.instrumentation.SourceSectionFilter.Builder;
import com.oracle.truffle.api.instrumentation.SourceSectionFilter.IndexRange;
import com.oracle.truffle.api.instrumentation.StandardTags;
import com.oracle.truffle.tools.utils.json.JSONArray;
import com.oracle.truffle.tools.utils.json.JSONObject;

import de.hpi.swa.liveprogramming.types.AbstractProbe.ExampleProbe;

public final class BabylonianAnalysisResult {
    private final HashMap<URI, BabylonianAnalysisFileResult> files = new HashMap<>();
    private SourceSectionFilter[] filters;

    public BabylonianAnalysisFileResult getOrCreateFile(URI uri, String languageId) {
        return files.computeIfAbsent(uri, u -> new BabylonianAnalysisFileResult(u, languageId));
    }

    public Collection<BabylonianAnalysisFileResult> getFileResults() {
        return files.values();
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

    public SourceSectionFilter[] getSourceSectionFilters() {
        if (filters == null) {
            filters = new SourceSectionFilter[files.size()];
            int filterIndex = 0;
            for (Map.Entry<URI, BabylonianAnalysisFileResult> entry : files.entrySet()) {
                Builder builder = SourceSectionFilter.newBuilder().tagIs(StandardTags.StatementTag.class);
                // Check URI rather than source identity as source may change
                builder.sourceIs(s -> s.getURI().equals(entry.getKey()));
                // All probe and assertion lines
                builder.lineIn(toIndexRanges(entry.getValue().probes.keySet()));
                filters[filterIndex++] = builder.build();
            }
        }
        return filters;
    }

    private static IndexRange[] toIndexRanges(Set<Integer> set) {
        return set.stream().map(i -> IndexRange.between(i, i + 1)).toArray(IndexRange[]::new);
    }

    public static final class BabylonianAnalysisTerminationResult {
        public static JSONObject create(long startMillis, String error) {
            JSONObject json = new JSONObject();
            json.put("timeToRunMillis", System.currentTimeMillis() - startMillis);
            if (error != null) {
                json.put("error", error);
            }
            return json;
        }
    }

    public static final class BabylonianAnalysisFileResult {
        private final URI uri;
        private final String languageId;
        private final ArrayList<ExampleProbe> examples = new ArrayList<>();
        private final HashMap<Integer, AbstractProbe> probes = new HashMap<>();

        public BabylonianAnalysisFileResult(URI uri, String languageId) {
            this.uri = uri;
            this.languageId = languageId;
        }

        private JSONObject toJSON() {
            JSONObject json = new JSONObject();
            json.put("uri", uri.toString());
            json.put("languageId", languageId);
            JSONArray probesJSON = new JSONArray();
            for (AbstractProbe probe : examples) {
                probesJSON.put(probe.toJSON());
            }
            for (AbstractProbe probe : probes.values()) {
                probesJSON.put(probe.toJSON());
            }
            json.put("probes", probesJSON);
            return json;
        }

        public void addProbe(int triggerLine, AbstractProbe probe) {
            assert !probes.containsKey(triggerLine);
            probes.put(triggerLine, probe);
        }

        public AbstractProbe get(int triggerLine) {
            return probes.get(triggerLine);
        }

        public void addExample(ExampleProbe example) {
            examples.add(example);
        }

        public Collection<ExampleProbe> getExamples() {
            return examples;
        }

        public URI getURI() {
            return uri;
        }
    }

    public enum ProbeType {
        EXAMPLE,
        PROBE,
        ASSERTION,
        ORPHAN,
    }
}
