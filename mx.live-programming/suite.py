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

    "version": "20.2.0-dev",

    "release": False,
    "groupId": "de.hpi.swa.liveprogramming",
    "url": "https://github.com/hpi-swa-lab/vscode-live-programming",

    "developer": {
        "name": "Fabio Niephaus and contributors",
        "email": "code@fniephaus.com",
        "organization": "Software Architecture Group, HPI, Potsdam, Germany",
        "organizationUrl": "https://www.hpi.uni-potsdam.de/swa/",
    },

    "scm": {
        "url": "https://github.com/hpi-swa-lab/vscode-live-programming/",
        "read": "https://github.com/hpi-swa-lab/vscode-live-programming.git",
        "write": "git@github.com:hpi-swa-lab/vscode-live-programming.git",
    },

    # ==========================================================================
    #  DEPENDENCIES
    # ==========================================================================
    "imports": {
        "suites": [{
            "name": "truffle",
            "subdir": True,
            "version": "9ec0dee18a518742e08fe719a34071e9fae87bb1",
            "urls": [{
                "url": "https://github.com/hpi-swa-lab/graal",
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
        }
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
        },
    },
}
