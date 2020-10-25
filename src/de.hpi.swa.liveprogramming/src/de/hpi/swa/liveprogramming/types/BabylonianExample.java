/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming.types;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import com.oracle.truffle.api.CompilerDirectives;
import com.oracle.truffle.api.instrumentation.SourceSectionFilter;
import com.oracle.truffle.api.instrumentation.SourceSectionFilter.Builder;
import com.oracle.truffle.api.instrumentation.SourceSectionFilter.IndexRange;
import com.oracle.truffle.api.instrumentation.StandardTags;
import com.oracle.truffle.api.interop.InteropLibrary;
import com.oracle.truffle.api.interop.UnsupportedMessageException;
import com.oracle.truffle.api.source.Source;
import com.oracle.truffle.api.source.SourceSection;

import de.hpi.swa.liveprogramming.BabylonianAnalysisExtension.BabylonianAnalysisCommand;
import de.hpi.swa.liveprogramming.BabylonianAnalysisExtension.BabylonianAnalysisCommand.FunctionDefinition;
import de.hpi.swa.liveprogramming.types.BabylonianAnalysisResult.BabylonianAnalysisLineResult;
import de.hpi.swa.liveprogramming.types.BabylonianAnalysisResult.ProbeType;

public class BabylonianExample {
    public static final String EXAMPLE_FILTER_ATTRIBUTE = ":example";
    private static final String EXAMPLE_NAME_ATTRIBUTE = ":name";

    private static final InteropLibrary LIB = InteropLibrary.getFactory().getUncached();

    private final BabylonianAnalysisLineResult lineResult;
    private final String name;
    private final String targetIdentifier;
    private final String[] targetArgumentExpressions;
    private final Source targeSource;

    public BabylonianExample(String line, BabylonianAnalysisLineResult lineResult, Source source, FunctionDefinition functionDefinition, LinkedHashMap<String, String> attributes) {
        this.lineResult = lineResult;
        name = attributes.getOrDefault(EXAMPLE_NAME_ATTRIBUTE, fallbackName(line));
        targeSource = source;
        targetIdentifier = functionDefinition.getIdentifier();
        LinkedHashSet<String> parameters = functionDefinition.getParameters();
        targetArgumentExpressions = new String[parameters.size()];
        int i = 0;
        for (String parameterName : parameters) {
            targetArgumentExpressions[i++] = attributes.get(parameterName);
        }
    }

    private static String fallbackName(String line) {
        return line.substring(line.indexOf(BabylonianAnalysisCommand.EXAMPLE_PREFIX), line.lastIndexOf('>') + 1);
    }

    public BabylonianAnalysisLineResult getLineResult() {
        return lineResult;
    }

    public String getName() {
        return name;
    }

    public Source getTargetSource() {
        return targeSource;
    }

    public String getTargetIdentifier() {
        return targetIdentifier;
    }

    public String[] getTargetArgumentExpressions() {
        return targetArgumentExpressions;
    }

    public String getInvocationExpression() {
        // TODO: Find better way to determine invocation expression (this is not language-agnostic).
        return String.format("%s(%s)", targetIdentifier, String.join(", ", targetArgumentExpressions));
    }

    public static class TriggerlineToProbesMap extends HashMap<Integer, ArrayList<AbstractProbe>> {
        private static final long serialVersionUID = 1L;

        public TriggerlineToProbesMap() {
        }

        public void addProbe(int triggerLine, AbstractProbe probe) {
            computeIfAbsent(triggerLine, t -> new ArrayList<>()).add(probe);
        }
    }

    public static class ProbeMap extends HashMap<URI, TriggerlineToProbesMap> {
        private static final long serialVersionUID = 1L;

        public ProbeMap() {
        }

        public SourceSectionFilter[] getSourceSectionFilters(BabylonianExample example) {
            SourceSectionFilter[] filters = new SourceSectionFilter[size()];
            int filterIndex = 0;
            for (Map.Entry<URI, TriggerlineToProbesMap> entry : entrySet()) {
                Builder builder = SourceSectionFilter.newBuilder().tagIs(StandardTags.StatementTag.class);
                URI uri = entry.getKey();
                if (uri.equals(example.getTargetSource().getURI())) {
                    builder.sourceIs(example.getTargetSource());
                } else {
                    // Check URI rather than source identity as source may change
                    builder.sourceIs(s -> s.getURI().equals(entry.getKey()));
                }
                // All probe and assertion lines
                builder.lineIn(toIndexRanges(entry.getValue().keySet()));
                filters[filterIndex++] = builder.build();
            }
            return filters;
        }

        private static IndexRange[] toIndexRanges(Set<Integer> set) {
            return set.stream().map(i -> IndexRange.between(i, i + 1)).toArray(IndexRange[]::new);
        }
    }

    public abstract static class AbstractProbe {
        private final String exampleNameOrNull;
        private final BabylonianAnalysisLineResult lineResult;

        public AbstractProbe(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult) {
            this.exampleNameOrNull = exampleNameOrNull;
            this.lineResult = lineResult;
        }

        public final void apply(BabylonianExample example, SourceSection section, Object result, Function<String, Object> inlineEvaluator) {
            if (exampleNameOrNull == null || exampleNameOrNull.equals(example.name)) {
                lineResult.recordObservedValue(example.name, getProbeType(), getObjectInformation(example, section, result, inlineEvaluator));
            }
        }

        protected static final String toDisplayString(Object value) {
            try {
                return LIB.asString(LIB.toDisplayString(value));
            } catch (UnsupportedMessageException e) {
                return e.getMessage();
            }
        }

        protected abstract ObjectInformation getObjectInformation(BabylonianExample example, SourceSection section, Object value, Function<String, Object> inlineEvaluator);

        protected abstract ProbeType getProbeType();
    }

    public static class ExampleProbe extends AbstractProbe {
        public ExampleProbe(BabylonianAnalysisLineResult lineResult) {
            super(null, lineResult);
        }

        @Override
        protected ObjectInformation getObjectInformation(BabylonianExample example, SourceSection section, Object value, Function<String, Object> inlineEvaluator) {
            return ObjectInformation.create(section.getCharacters().toString(), value);
        }

        @Override
        protected ProbeType getProbeType() {
            return ProbeType.EXAMPLE;
        }
    }

    public static class StatementProbe extends AbstractProbe {
        public StatementProbe(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult) {
            super(exampleNameOrNull, lineResult);
        }

        @Override
        protected ObjectInformation getObjectInformation(BabylonianExample example, SourceSection section, Object value, Function<String, Object> inlineEvaluator) {
            return ObjectInformation.create(section.getCharacters().toString(), value);
        }

        @Override
        protected ProbeType getProbeType() {
            return ProbeType.PROBE;
        }
    }

    public static class StatementProbeWithExpression extends StatementProbe {
        public static final String PROBE_EXPRESSION_ATTRIBUTE = ":expression";
        private final String expression;

        public StatementProbeWithExpression(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult, String expression) {
            super(exampleNameOrNull, lineResult);
            this.expression = expression;
        }

        @Override
        protected ObjectInformation getObjectInformation(BabylonianExample example, SourceSection section, Object value, Function<String, Object> inlineEvaluator) {
            return ObjectInformation.create(expression, inlineEvaluator.apply(expression));
        }
    }

    public static class AssertionProbe extends AbstractProbe {
        public static final String ASSERTION_EXPECTED_ATTRIBUTE = ":expected";
        public static final String ASSERTION_EXPRESSION_ATTRIBUTE = ":expression";

        private final String expression;
        private final boolean isExpectedValue;

        public AssertionProbe(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult, String expression, boolean isExpectedValue) {
            super(exampleNameOrNull, lineResult);
            this.expression = expression;
            this.isExpectedValue = isExpectedValue;
        }

        public boolean isExpectedValue() {
            return isExpectedValue;
        }

        @Override
        protected ObjectInformation getObjectInformation(BabylonianExample example, SourceSection section, Object value, Function<String, Object> inlineEvaluator) {
            Object result = inlineEvaluator.apply(expression);
            boolean assertionState;
            if (isExpectedValue) {
                assertionState = result.equals(value);
            } else {
                try {
                    assertionState = LIB.isBoolean(result) && LIB.asBoolean(result);
                } catch (UnsupportedMessageException e) {
                    throw CompilerDirectives.shouldNotReachHere(e);
                }
            }
            if (assertionState) {
                return ObjectInformation.create(expression, assertionState);
            } else {
                return ObjectInformation.create(expression, assertionState, String.format("expected: %s; got: %s", result, isExpectedValue ? value : true));
            }
        }

        @Override
        protected ProbeType getProbeType() {
            return ProbeType.ASSERTION;
        }
    }
}
