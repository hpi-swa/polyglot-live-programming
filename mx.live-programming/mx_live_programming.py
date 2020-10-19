#
# Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
#
# Licensed under the MIT License.
#

import mx
import mx_sdk_vm

import os
from os.path import join, isfile, exists

_suite = mx.suite('live-programming')


class VSCodeExtensionProject(mx.ArchivableProject):
    def __init__(self, suite, name, deps, workingSets, theLicense, mxLibs=None, **args):
        mx.ArchivableProject.__init__(self, suite, name, deps, workingSets, theLicense)
        self.dir = suite.dir

    def archive_prefix(self):
        return ''

    def output_dir(self):
        return self.dir

    def getResults(self, replaceVar=False):
        results = []
        for root, _, files in os.walk(self.output_dir()):
            for file in files:
                if file.endswith(".vsix"):
                    results.append(join(root, file))
        return results

    def getBuildTask(self, args):
        return VSCodeExtensionBuildTask(self, args)


class VSCodeExtensionBuildTask(mx.ArchivableBuildTask):
    def __init__(self, subject, args):
        mx.ArchivableBuildTask.__init__(self, subject, args, 1)

    def __str__(self):
        return 'Building {}'.format(self.subject)

    def newestInput(self):
        inputPaths = []
        for path in [join(self.subject.dir, m) for m in ['', 'media', 'snippets', 'src']]:
            if exists(path):
                inputPaths.extend(join(path, f) for f in os.listdir(path) if isfile(join(path, f)))
        return mx.TimeStampFile.newest(inputPaths)

    def needsBuild(self, newestInput):
        out = self.newestOutput()
        if not out or self.newestInput().isNewerThan(out):
            return (True, None)
        return (False, None)

    def build(self):
        vsce = join(_suite.dir, 'node_modules', '.bin', 'vsce')
        if not exists(vsce):
            mx.run(['npm', 'install', 'vsce'], nonZeroIsFatal=True, cwd=_suite.dir)
        mx.run(['npm', 'install'], nonZeroIsFatal=True, cwd=self.subject.dir)
        mx.run([vsce, 'package'], nonZeroIsFatal=True, cwd=self.subject.dir)

    def clean(self, forBuild=False):
        for file in self.subject.getResults():
            os.remove(file)
        for path in [join(self.subject.dir, m) for m in ['out', 'node_modules']]:
            if exists(path):
                mx.rmtree(path)


mx_sdk_vm.register_graalvm_component(mx_sdk_vm.GraalVmTool(
    suite=_suite,
    name='HPI-SWA Live Programming Features',
    short_name='live',
    dir_name='live',
    license_files=[],
    third_party_license_files=[],
    truffle_jars=['live-programming:LIVE_PROGRAMMING'],
    support_distributions=[],
    include_by_default=True,
))
