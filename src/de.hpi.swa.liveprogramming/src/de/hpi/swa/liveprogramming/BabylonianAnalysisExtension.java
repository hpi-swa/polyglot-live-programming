/*
 * Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.graalvm.tools.api.lsp.LSPCommand;
import org.graalvm.tools.api.lsp.LSPExtension;
import org.graalvm.tools.api.lsp.LSPServerAccessor;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.xml.sax.SAXException;

import com.oracle.truffle.api.CompilerDirectives;
import com.oracle.truffle.api.frame.VirtualFrame;
import com.oracle.truffle.api.instrumentation.EventBinding;
import com.oracle.truffle.api.instrumentation.EventContext;
import com.oracle.truffle.api.instrumentation.ExecutionEventNode;
import com.oracle.truffle.api.instrumentation.ExecutionEventNodeFactory;
import com.oracle.truffle.api.instrumentation.SourceSectionFilter;
import com.oracle.truffle.api.instrumentation.TruffleInstrument;
import com.oracle.truffle.api.instrumentation.TruffleInstrument.Registration;
import com.oracle.truffle.api.interop.ArityException;
import com.oracle.truffle.api.interop.InteropLibrary;
import com.oracle.truffle.api.interop.UnknownIdentifierException;
import com.oracle.truffle.api.interop.UnsupportedMessageException;
import com.oracle.truffle.api.interop.UnsupportedTypeException;
import com.oracle.truffle.api.nodes.ExecutableNode;
import com.oracle.truffle.api.nodes.LanguageInfo;
import com.oracle.truffle.api.source.Source;
import com.oracle.truffle.api.source.SourceSection;

import de.hpi.swa.liveprogramming.types.BabylonianAnalysisResult;
import de.hpi.swa.liveprogramming.types.BabylonianAnalysisResult.BabylonianAnalysisFileResult;
import de.hpi.swa.liveprogramming.types.BabylonianAnalysisResult.ProbeType;
import de.hpi.swa.liveprogramming.types.BabylonianExample;
import de.hpi.swa.liveprogramming.types.BabylonianExample.AbstractProbe;
import de.hpi.swa.liveprogramming.types.BabylonianExample.AssertionProbe;
import de.hpi.swa.liveprogramming.types.BabylonianExample.ExpressionProbe;
import de.hpi.swa.liveprogramming.types.BabylonianExample.ProbeMap;
import de.hpi.swa.liveprogramming.types.BabylonianExample.StatementProbe;
import de.hpi.swa.liveprogramming.types.BabylonianExample.TriggerlineToProbesMap;
import de.hpi.swa.liveprogramming.types.ObjectInformation;

@Registration(id = BabylonianAnalysisExtension.ID, name = BabylonianAnalysisExtension.NAME, version = BabylonianAnalysisExtension.VERSION, services = LSPExtension.class)
public class BabylonianAnalysisExtension extends TruffleInstrument implements LSPExtension {
    protected static final String ID = "babylonian-analysis-lsp-extension";
    protected static final String NAME = "Babylonian Analysis LSP Extension";
    protected static final String VERSION = "0.1";

    public List<LSPCommand> getCommands() {
        return Arrays.asList(new BabylonianAnalysisCommand());
    }

    public static class BabylonianAnalysisCommand implements LSPCommand {

        public static final String EXAMPLE_PREFIX = "<Example ";
        public static final String PROBE_PREFIX = "<Probe ";
        public static final String ASSERTION_PREFIX = "<Assertion ";
        public static final String BABYLONIAN_ANALYSIS_RESULT_METHOD = "textDocument/babylonianAnalysisResult";
        private static final Pattern EXTRACT_IDENTIFIER_AND_PARAMETERS = Pattern.compile("([a-zA-Z0-9]*)\\(([a-zA-Z0-9\\-_\\, ]*)");
        private static final DocumentBuilder XML_PARSER;
        private static final String ASYNC_WORKER_NAME = "LS Babylonian Async Updater";
        private static final InteropLibrary INTEROP = InteropLibrary.getUncached();

        private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(0, r -> new Thread(r, ASYNC_WORKER_NAME));

        static {
            try {
                XML_PARSER = DocumentBuilderFactory.newInstance().newDocumentBuilder();
            } catch (ParserConfigurationException e) {
                throw new RuntimeException(e);
            }
        }

        public String getName() {
            return "babylonian_analysis";
        }

        public Object execute(LSPServerAccessor server, Env envInternal, List<Object> arguments) {
            URI targetURI = URI.create((String) arguments.get(0));
            Set<URI> openFileURIs = server.getOpenFileURI2LangId().keySet();

            assert openFileURIs.contains(targetURI) : "targetURI not in openFileURIs";

            BabylonianAnalysisResult result = new BabylonianAnalysisResult();

            ProbeMap probeMap = new ProbeMap();
            ArrayList<BabylonianExample> examples = new ArrayList<>();

            for (URI uri : openFileURIs) {
                Source source = server.getSource(uri);
                if (source != null && source.hasCharacters()) {
                    scanDocument(result.getOrCreateFile(uri), probeMap.computeIfAbsent(uri, u -> new TriggerlineToProbesMap()), examples, source);
                    try {
                        envInternal.parse(source).call();
                    } catch (IOException e) {
                        e.printStackTrace();
                        return false;
                    }
                }
            }

            ScheduledFuture<?> future = sendDecorationsPeriodically(server, result);
            try {
                for (BabylonianExample example : examples) {
                    runExampleInstrumented(envInternal, probeMap, example);
                }
            } finally {
                future.cancel(true);
                // Send all decorations
                server.sendCustomNotification(BABYLONIAN_ANALYSIS_RESULT_METHOD, result.toJSON());
            }
            return true;
        }

        public int getTimeoutMillis() {
            return 10000;
        }

        public Object onTimeout(List<Object> arguments) {
            return false;
        }

        private static void scanDocument(BabylonianAnalysisFileResult fileResult, TriggerlineToProbesMap triggerlineToProbeMap, ArrayList<BabylonianExample> examples, Source source) {
            for (int lineNumber = 1; lineNumber <= source.getLineCount(); lineNumber++) {
                String line = source.getCharacters(lineNumber).toString();
                if (line.contains(EXAMPLE_PREFIX)) {
                    LinkedHashMap<String, String> attributes = getAttributesOrNull(line, EXAMPLE_PREFIX);
                    if (attributes == null) {
                        break; // Skip line, insufficient attributes for example
                    }
                    FunctionDefinition functionDefinition = findFunctionDefinition(lineNumber, source);
                    if (functionDefinition == null) {
                        break; // End of source reached
                    }
                    if (attributes.keySet().containsAll(functionDefinition.parameters)) {
                        examples.add(new BabylonianExample(line, fileResult.getOrCreateLineResult(lineNumber), source, functionDefinition, attributes));
                    }
                } else {
                    boolean containsProbe = line.contains(PROBE_PREFIX);
                    boolean containsAssertion = line.contains(ASSERTION_PREFIX);
                    if (containsProbe || containsAssertion) {
                        int triggerLine = findTriggerLine(lineNumber + 1, source);
                        if (triggerLine < 0) {
                            break; // End of source reached
                        }
                        AbstractProbe probe;
                        if (containsProbe) {
                            LinkedHashMap<String, String> attributes = getAttributesOrNull(line, PROBE_PREFIX);
                            String expression = attributes == null ? null : attributes.get(ExpressionProbe.PROBE_EXPRESSION_ATTRIBUTE);
                            String exampleNameOrNull = attributes.get(BabylonianExample.EXAMPLE_FILTER_ATTRIBUTE);
                            if (expression == null) {
                                probe = new StatementProbe(exampleNameOrNull, fileResult.getOrCreateLineResult(triggerLine));
                            } else {
                                probe = new ExpressionProbe(exampleNameOrNull, fileResult.getOrCreateLineResult(lineNumber), expression);
                            }
                        } else {
                            LinkedHashMap<String, String> attributes = getAttributesOrNull(line, ASSERTION_PREFIX);
                            if (attributes == null) {
                                break; // Skip line, assertions must have attributes
                            }
                            int targetLineNumber;
                            String probeExpression;
                            boolean isExpectedValue;
                            String expected = attributes.get(AssertionProbe.ASSERTION_EXPECTED_ATTRIBUTE);
                            if (expected != null) {
                                targetLineNumber = triggerLine;
                                probeExpression = expected;
                                isExpectedValue = true;
                            } else {
                                String expression = attributes.get(AssertionProbe.ASSERTION_EXPRESSION_ATTRIBUTE);
                                if (expression == null) {
                                    break; // Skip line, insufficient attributes for assertion
                                }
                                targetLineNumber = lineNumber;
                                probeExpression = expression;
                                isExpectedValue = false;
                            }
                            String exampleNameOrNull = attributes.get(BabylonianExample.EXAMPLE_FILTER_ATTRIBUTE);
                            probe = new AssertionProbe(exampleNameOrNull, fileResult.getOrCreateLineResult(targetLineNumber), probeExpression, isExpectedValue);

                        }
                        triggerlineToProbeMap.addProbe(triggerLine, probe);
                    }
                }
            }
        }

        private static FunctionDefinition findFunctionDefinition(int startLineNumber, Source source) {
            for (int lineNumber = startLineNumber; lineNumber < source.getLineCount(); lineNumber++) {
                String line = source.getCharacters(lineNumber).toString();
                if (line.contains(EXAMPLE_PREFIX)) {
                    continue; // Skip consecutive examples
                }
                Matcher m = EXTRACT_IDENTIFIER_AND_PARAMETERS.matcher(line);
                if (m.find()) {
                    return new FunctionDefinition(m.group(1), m.group(2).replaceAll(" ", "").split(","));
                } else {
                    printError("Unable to find function definition in:\n" + line);
                    return null;
                }
            }
            return null;
        }

        private static int findTriggerLine(int startLineNumber, Source source) {
            for (int lineNumber = startLineNumber; lineNumber < source.getLineCount(); lineNumber++) {
                String line = source.getCharacters(lineNumber).toString();
                if (line.isBlank() || line.contains(PROBE_PREFIX) || line.contains(ASSERTION_PREFIX)) {
                    continue; // Skip consecutive probes and assertions
                }
                if (!line.isBlank()) {
                    return lineNumber; // Trigger line must not be blank
                }
            }
            return -1;
        }

        public static LinkedHashMap<String, String> getAttributesOrNull(String line, String tagPrefix) {
            int startIndex = line.indexOf(tagPrefix);
            int endIndex = line.lastIndexOf('>') + 1;
            assert startIndex > 0;
            if (!(endIndex > 0)) {
                return null;
            }
            String xmlSource = line.substring(startIndex, endIndex);
            try {
                Element xml = XML_PARSER.parse(new ByteArrayInputStream(xmlSource.getBytes())).getDocumentElement();
                LinkedHashMap<String, String> parametersAndValues = new LinkedHashMap<>();
                NamedNodeMap attributes = xml.getAttributes();
                for (int i = 0; i < attributes.getLength(); i++) {
                    Node item = attributes.item(i);
                    parametersAndValues.put(item.getNodeName(), item.getNodeValue());
                }
                return parametersAndValues;
            } catch (SAXException | IOException e) {
                e.printStackTrace();
                return null;
            }
        }

        public static final class FunctionDefinition {
            private final String identifier;
            private final LinkedHashSet<String> parameters;

            private FunctionDefinition(String identifier, String[] parameters) {
                this.identifier = identifier;
                this.parameters = new LinkedHashSet<>();
                for (String parameter : parameters) {
                    this.parameters.add(parameter);
                }
            }

            public String getIdentifier() {
                return identifier;
            }

            public LinkedHashSet<String> getParameters() {
                return parameters;
            }
        }

        private ScheduledFuture<?> sendDecorationsPeriodically(LSPServerAccessor server, BabylonianAnalysisResult result) {
            return scheduler.scheduleAtFixedRate(new Runnable() {
                public void run() {
                    server.sendCustomNotification(BABYLONIAN_ANALYSIS_RESULT_METHOD, result.toJSON());
                }
            }, 250, 500, TimeUnit.MILLISECONDS);
        }

        private static boolean runExampleInstrumented(Env env, ProbeMap probeMap, BabylonianExample example) {
            String languageId = example.getTargetSource().getLanguage();
            LanguageInfo languageInfo = env.getLanguages().get(languageId);
            Object scope = env.getScope(languageInfo);
            Object targetObject;
            try {
                targetObject = INTEROP.readMember(scope, example.getTargetIdentifier());
            } catch (UnsupportedMessageException | UnknownIdentifierException e) {
                e.printStackTrace();
                return false;
            }
            if (!INTEROP.isExecutable(targetObject)) {
                return false;
            }
            final Object[] arguments = getExampleArguments(env, languageId, example.getTargetArgumentExpressions());
            if (arguments == null) {
                return false;
            }
            BabylonianEventNodeFactory babylonianEventNodeFactory = new BabylonianEventNodeFactory(env, probeMap, example);
            ArrayList<EventBinding<ExecutionEventNodeFactory>> bindings = new ArrayList<>();
            for (SourceSectionFilter filter : probeMap.getSourceSectionFilters(example)) {
                bindings.add(env.getInstrumenter().attachExecutionEventFactory(filter, babylonianEventNodeFactory));
            }
            try {
                Object exampleResult = INTEROP.execute(targetObject, arguments);
                ObjectInformation info = ObjectInformation.create(example.getTargetIdentifier(), exampleResult);
                example.getLineResult().recordObservedValue(example.getName(), ProbeType.EXAMPLE, info);
                return true;
            } catch (ArityException e) {
                e.printStackTrace();
            } catch (UnsupportedTypeException e) {
                e.printStackTrace();
            } catch (UnsupportedMessageException e) {
                e.printStackTrace();
            } catch (ThreadDeath /* EvaluationResultException */ e) {
                e.printStackTrace();
            } catch (RuntimeException e) {
                e.printStackTrace();
            } finally {
                for (EventBinding<ExecutionEventNodeFactory> binding : bindings) {
                    binding.dispose();
                }
            }
            return false;
        }

        private static Object[] getExampleArguments(Env env, String languageId, String[] expressions) {
            final Object[] arguments = new Object[expressions.length];
            for (int i = 0; i < arguments.length; i++) {
                try {
                    arguments[i] = env.parse(Source.newBuilder(languageId, expressions[i], "<argument expression>").build()).call();
                } catch (final Throwable e) {
                    e.printStackTrace();
                    return null;
                }
            }
            return arguments;
        }

        private static final class BabylonianEventNodeFactory implements ExecutionEventNodeFactory {
            private final Env env;
            private final ProbeMap probeMap;
            private final BabylonianExample example;

            private BabylonianEventNodeFactory(Env env, ProbeMap probeMap, BabylonianExample example) {
                this.env = env;
                this.probeMap = probeMap;
                this.example = example;
            }

            public ExecutionEventNode create(EventContext context) {
                return new BabylonianEventNode(env, probeMap, example, context);
            }

            private static final class BabylonianEventNode extends ExecutionEventNode {
                private static final String INLINE_PROBE_EXPRESSION_NAME = "<inline probe expression>";

                @Child private ExecutableNode inlineExecutionNode;

                private final Env env;
                private final ProbeMap probeMap;
                private final BabylonianExample example;
                private final EventContext context;

                private BabylonianEventNode(Env env, ProbeMap probeMap, BabylonianExample example, EventContext context) {
                    this.env = env;
                    this.probeMap = probeMap;
                    this.example = example;
                    this.context = context;
                }

                @Override
                public void onReturnValue(VirtualFrame frame, Object result) {
                    SourceSection section = context.getInstrumentedSourceSection();
                    Function<String, Object> inlineEvalutator = expression -> {
                        try {
                            return executeInline(frame, Source.newBuilder(section.getSource().getLanguage(), expression, INLINE_PROBE_EXPRESSION_NAME).build());
                        } catch (Exception e) {
                            return e.getMessage();
                        }
                    };
                    URI uri = section.getSource().getURI();
                    TriggerlineToProbesMap triggerlineToProbesMap = probeMap.get(uri);
                    ArrayList<AbstractProbe> probes = triggerlineToProbesMap.get(section.getStartLine());
                    if (probes != null) {
                        for (AbstractProbe probe : probes) {
                            probe.apply(example, section, result, inlineEvalutator);
                        }
                    }
                }

                @Override
                protected void onReturnExceptional(VirtualFrame frame, Throwable exception) {
                    onReturnValue(frame, exception.getMessage());
                }

                private Object executeInline(VirtualFrame frame, Source source) {
                    CompilerDirectives.transferToInterpreterAndInvalidate();
                    ExecutableNode newNode = env.parseInline(source, context.getInstrumentedNode(), frame.materialize());
                    if (inlineExecutionNode == null) {
                        inlineExecutionNode = insert(newNode);
                    } else {
                        inlineExecutionNode.replace(newNode);
                    }
                    notifyInserted(inlineExecutionNode);
                    return inlineExecutionNode.execute(frame);
                }
            }
        }
    }

    private static void printError(String message) {
        // Checkstyle: stop
        System.err.println(message);
        // Checkstyle: resume
    }

    @Override
    protected void onCreate(Env env) {
        env.registerService(this);
    }
}
