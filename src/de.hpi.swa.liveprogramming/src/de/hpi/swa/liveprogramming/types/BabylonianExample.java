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
    private static final String BABYLONIAN_SOURCE_NAME = "<babylonian request>";
    public static final String EXAMPLE_FILTER_ATTRIBUTE = ":example";
    private static final String EXAMPLE_NAME_ATTRIBUTE = ":name";
    private static final int EMOTICONS_START = 0x1F32D;
    private static final int EMOTICONS_END = 0x1F37F;

    private static final InteropLibrary LIB = InteropLibrary.getFactory().getUncached();

    private final int lineNumber;
    private final String name;
    private final URI targetURI;
    private final Source source;

    public BabylonianExample(String line, int lineIndex, Source originalSource, String language, FunctionDefinition functionDefinition, LinkedHashMap<String, String> attributes) {
        this.lineNumber = lineIndex;
        name = attributes.getOrDefault(EXAMPLE_NAME_ATTRIBUTE, fallbackName(line));
        targetURI = originalSource.getURI();
        source = Source.newBuilder(language, getInstrumentedSourceCode(originalSource.getCharacters().toString(), functionDefinition, attributes), BABYLONIAN_SOURCE_NAME).build();
    }

    private static String fallbackName(String line) {
        return line.substring(line.indexOf(BabylonianAnalysisCommand.EXAMPLE_PREFIX), line.lastIndexOf('>') + 1);
    }

    private static String getInstrumentedSourceCode(String documentCode, FunctionDefinition functionDefinition, LinkedHashMap<String, String> attributes) {
        StringBuilder sb = new StringBuilder(documentCode).append('\n');
        appendInvocationCode(sb, functionDefinition, attributes);
        return sb.toString();
    }

    private static void appendInvocationCode(StringBuilder sb, FunctionDefinition functionDefinition, LinkedHashMap<String, String> attributes) {
        sb.append(functionDefinition.getIdentifier()).append('(');
        if (!attributes.isEmpty()) {
            for (String parameterName : functionDefinition.getParameters()) {
                sb.append(attributes.get(parameterName));
                sb.append(",");
            }
            sb.deleteCharAt(sb.length() - 1);
        }
        sb.append(')');
    }

    public String getName() {
        return name;
    }

    public Source getSource() {
        return source;
    }

    public URI getTargetURI() {
        return targetURI;
    }

    public String getEmoji() {
        return new String(Character.toChars(EMOTICONS_START + name.hashCode() % (EMOTICONS_END - EMOTICONS_START)));
    }

    public ProbeMap deriveProbeMap(BabylonianAnalysisResult result, ProbeMap probeMap) {
        ProbeMap probeMapCopy = probeMap.copy();
        TriggerlineToProbesMap triggerLineToProbesMap = probeMapCopy.remove(targetURI);
        if (triggerLineToProbesMap == null) {
            throw new AssertionError("Unable to find TriggerlineToProbesMap", null);
        }
        TriggerlineToProbesMap triggerLineToProbesMapCopy = triggerLineToProbesMap.copy();
        // Invocation code is in last line
        triggerLineToProbesMapCopy.addProbe(source.getLineCount(), new ExampleProbe(result.getOrCreateFile(targetURI).getOrCreateLineResult(lineNumber)));
        probeMapCopy.put(targetURI, triggerLineToProbesMapCopy);
        return probeMapCopy;
    }

    public static class TriggerlineToProbesMap extends HashMap<Integer, ArrayList<AbstractProbe>> {
        private static final long serialVersionUID = 1L;

        public TriggerlineToProbesMap() {
        }

        private TriggerlineToProbesMap(TriggerlineToProbesMap original) {
            super(original);
        }

        private TriggerlineToProbesMap copy() {
            return new TriggerlineToProbesMap(this);
        }

        public void addProbe(int triggerLine, AbstractProbe probe) {
            computeIfAbsent(triggerLine, t -> new ArrayList<>()).add(probe);
        }
    }

    public static class ProbeMap extends HashMap<URI, TriggerlineToProbesMap> {
        private static final long serialVersionUID = 1L;

        public ProbeMap() {
        }

        private ProbeMap(ProbeMap original) {
            super(original);
        }

        private ProbeMap copy() {
            return new ProbeMap(this);
        }

        public SourceSectionFilter[] getSourceSectionFilters(BabylonianExample example) {
            SourceSectionFilter[] filters = new SourceSectionFilter[size()];
            int filterIndex = 0;
            for (Map.Entry<URI, TriggerlineToProbesMap> entry : entrySet()) {
                Builder builder = SourceSectionFilter.newBuilder().tagIs(StandardTags.StatementTag.class);
                URI uri = entry.getKey();
                if (uri.equals(example.targetURI)) {
                    builder.sourceIs(example.source);
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

    private abstract static class StandardProbe extends AbstractProbe {
        private StandardProbe(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult) {
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

    public static class StatementProbe extends StandardProbe {
        public StatementProbe(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult) {
            super(exampleNameOrNull, lineResult);
        }
    }

    public static class ExpressionProbe extends StandardProbe {
        public static final String PROBE_EXPRESSION_ATTRIBUTE = ":expression";
        private final String expression;

        public ExpressionProbe(String exampleNameOrNull, BabylonianAnalysisLineResult lineResult, String expression) {
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
