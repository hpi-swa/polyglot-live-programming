/*
 * Copyright (c) 2021, Software Architecture Group, Hasso Plattner Institute.
 *
 * Licensed under the MIT License.
 */
package de.hpi.swa.liveprogramming;

import java.net.URI;
import java.util.Arrays;
import java.util.List;

import org.graalvm.tools.api.lsp.LSPCommand;
import org.graalvm.tools.api.lsp.LSPExtension;
import org.graalvm.tools.api.lsp.LSPServerAccessor;

import com.oracle.truffle.api.CallTarget;
import com.oracle.truffle.api.instrumentation.TruffleInstrument;
import com.oracle.truffle.api.instrumentation.TruffleInstrument.Registration;
import com.oracle.truffle.api.source.Source;

import de.hpi.swa.liveprogramming.types.ObjectInformation;

@Registration(id = DisplayExpressionExtension.ID, name = DisplayExpressionExtension.NAME, version = DisplayExpressionExtension.VERSION, services = LSPExtension.class)
public final class DisplayExpressionExtension extends TruffleInstrument implements LSPExtension {
    protected static final String ID = "display-expression-lsp-extension";
    protected static final String NAME = "Display Expression LSP Extension";
    protected static final String VERSION = "0.1";

    public List<LSPCommand> getCommands() {
        return Arrays.asList(new DisplayExpressionCommand());
    }

    private static final class DisplayExpressionCommand implements LSPCommand {

        public String getName() {
            return "display_expression";
        }

        public Object execute(LSPServerAccessor server, Env env, List<Object> arguments) {
            URI uri = URI.create((String) arguments.get(0));
            String selectedText = (String) arguments.get(1);
            try {
                String languageId = Source.findLanguage(uri.toURL());
                Source source = Source.newBuilder(languageId, selectedText, "<display expression>").build();
                CallTarget callTarget = env.parse(source);
                return ObjectInformation.create(selectedText, callTarget.call()).getJSON();
            } catch (Throwable e) {
                return ObjectInformation.createError(selectedText, "", e.getMessage()).getJSON();
            }
        }

        public int getTimeoutMillis() {
            return 5000;
        }

        public Object onTimeout(List<Object> arguments) {
            return ObjectInformation.createError((String) arguments.get(1), "", "Expression took too long to run.").getJSON();
        }
    }

    @Override
    protected void onCreate(Env env) {
        env.registerService(this);
    }
}
