#
# Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
#
# Licensed under the MIT License.
#

suite = {

    # ==========================================================================
    #  METADATA
    # ==========================================================================
    "name": "live-programming",
    "mxversion": "5.270.4",
    "versionConflictResolution": "latest",

    "version": "20.3.0-dev",
    "live-programming:dependencyMap": {
        "jdk11": "11.0.8",
        "jdk11_update": "10",
        "jvmci": "jvmci-20.3-b01",
    },

    "release": False,
    "groupId": "de.hpi.swa.liveprogramming",
    "url": "https://github.com/hpi-swa-lab/polyglot-live-programming",

    "developer": {
        "name": "Fabio Niephaus and contributors",
        "email": "code@fniephaus.com",
        "organization": "Software Architecture Group, HPI, Potsdam, Germany",
        "organizationUrl": "https://www.hpi.uni-potsdam.de/swa/",
    },

    "scm": {
        "url": "https://github.com/hpi-swa-lab/polyglot-live-programming/",
        "read": "https://github.com/hpi-swa-lab/polyglot-live-programming.git",
        "write": "git@github.com:hpi-swa-lab/polyglot-live-programming.git",
    },

    # ==========================================================================
    #  DEPENDENCIES
    # ==========================================================================
    "imports": {
        "suites": [{
            "name": "tools",
            "subdir": True,
            "version": "50987a13d6b6da2ce0087ed3fcf921f646ca63bb",
            "urls": [{
                "url": "https://github.com/oracle/graal",
                "kind": "git"
            }],
        }],
    },

    # ==========================================================================
    #  PROJECTS
    # ==========================================================================
    "projects": {
        "de.hpi.swa.liveprogramming": {
            "subDir": "src",
            "sourceDirs": ["src"],
            "dependencies": [
                "tools:LSP_API",
                "tools:TruffleJSON",
                "truffle:TRUFFLE_API",
            ],
            "annotationProcessors" : ["truffle:TRUFFLE_DSL_PROCESSOR"],
            "javaCompliance": "8+",
            "checkstyleVersion" : "8.8",
            "checkstyle": "de.hpi.swa.liveprogramming",
            "workingSets": "Live-Programming",
        },
        "vscode-extension": {
            "class": "VSCodeExtensionProject",
            "dependencies": [
                "LIVE_PROGRAMMING"
            ],
        },
    },

    # ==========================================================================
    #  DISTRIBUTIONS
    # ==========================================================================
    "distributions": {
        "LIVE_PROGRAMMING": {
            "description": "HPI-SWA Live Programming Features",
            "dependencies": [
                "de.hpi.swa.liveprogramming",
            ],
            "distDependencies": [
                "tools:LSP_API",
                "truffle:TRUFFLE_API",
            ],
            # This distribution defines a module.
            "moduleInfo" : {
                "name" : "de.hpi.swa.liveprogramming",
                "requiresConcealed" : {
                    "org.graalvm.truffle" : [
                        "com.oracle.truffle.api.instrumentation"
                    ],
                }
            },
        },
    },
}
