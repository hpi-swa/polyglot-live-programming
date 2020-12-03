# Change Log

All notable changes to the Polyglot Live Programming extension will be documented in this file.

## [0.0.2] - 2020-12-03

### Notice

*[GraalVM 20.3](https://github.com/graalvm/graalvm-ce-builds/releases/tag/vm-20.3.0) and the corresponding [VS Code extension](https://marketplace.visualstudio.com/items?itemName=oracle-labs-graalvm.graalvm) are now available. Please make sure VS Code is running version `0.5.0` of the GraalVM extension and follow the updated installation instructions in the [README.md](https://github.com/hpi-swa/polyglot-live-programming/blob/main/README.md).*

### Fixes

- Fixes installation instructions after the GraalVM extension was updated to `0.5.0`
- Fixes Babylonian Analysis on Windows (Filesystem URIs did not match correctly)

### Added

- Adds `installLiveComponent` command for installing the Live component with the GraalVM Updater
- Adds `toggleSelectionProbes` command for enabling/disabling selection probes (disabled by default)

## [0.0.1] - 2020-10-30
- Initial release