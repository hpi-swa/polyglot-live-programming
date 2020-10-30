# Polyglot Live Programming

[![VS Marketplace][vsm_badge]][vscode_extension] [![CI][ci_badge]][ci_url]

This repository contains extensions to enable Polyglot Live Programming with
[GraalVM][graalvm] and the [Language Server Protocol (LSP)][lsp].


## Getting Started

1. Install [our VS Code extension][vscode_extension]. This will also install the [GraalVM VS Code extension][graalvm_vscode].
2. Select or install a GraalVM on your system using the GraalVM extension.
3. Reload VS Code and wait until it is connected to the GraalLS.


## Demos

### Babylonian Programming: Selection Probes
![Selection Probes][demo_selection_probes]


## Related Publications

*To cite this work, please use [the Onward!'20 paper on
"Example-Based Live Programming for Everyone"][onward20_paper].*

### 2020
- Fabio Niephaus, Patrick Rein, Jakob Edding, Jonas Hering, Bastian König, Kolya
Opahle, Nico Scordialo, and Robert Hirschfeld. *Example-Based Live Programming
for Everyone: Building Language-agnostic Tools for Live Programming With LSP and
GraalVM*. In Proceedings of [the ACM Symposium for New Ideas, New Paradigms, and
Reflections on Everything to do with Programming and Software (Onward!)
2020][onward20], co-located with the Conference on Object-oriented Programming,
Systems, Languages, and Applications (OOPSLA), pages 108-124, Chicago, United
States, November 17-18, 2020, ACM DL.  
[![doi][onward20_doi]][onward20_paper] [![Preprint][preprint]][onward20_pdf]

### 2019
- Fabio Niephaus, Tim Felgentreff, and Robert Hirschfeld. *GraalSqueak: Toward a
Smalltalk-based Tooling Platform for Polyglot Programming*. In Proceedings of
[the International Conference on Managed Programming Languages and Runtimes
(MPLR) 2019][mplr19], co-located with the Conference on Object-oriented
Programming, Systems, Languages, and Applications (OOPSLA), 12 pages, Athens,
Greece, October 21, 2019, ACM DL.  
[![doi][mplr19_doi]][mplr19_paper] [![Preprint][preprint]][mplr19_pdf]

- Patrick Rein, Jens Lincke, Stefan Ramson, Toni Mattis, Fabio Niephaus, and
Robert Hirschfeld. *Implementing Babylonian/S by Putting Examples Into Contexts:
Tracing Instrumentation for Example-based Live Programming as a Use Case for
Context-oriented Programming*. In Proceedings of [the Workshop on
Context-oriented Programming (COP) 2019][cop19], co-located with the European
Conference on Object-oriented Programming (ECOOP), London, UK, July 15, 2019,
ACM DL.  
[![doi][cop19_doi]][cop19_paper] [![Preprint][preprint]][cop19_pdf]

- David Rauch, Patrick Rein, Stefan Ramson, Jens Lincke, and Robert Hirschfeld.
*Babylonian-style Programming: Design and Implementation of an Integration of
Live Examples Into General-purpose Source Code*. In [Journal on The Art,
Science, and Engineering of Programming, vol. 3, no. 3][prog19], art. 9, 39
pages, 2019.  
[![doi][prog19_doi]][prog19_paper] [![Preprint][preprint]][prog19_pdf]

### 2018
- Patrick Rein, Stefan Ramson, Jens Lincke, Robert Hirschfeld, and Tobias Pape.
*Exploratory and Live, Programming and Coding: A Literature Study*. In [Journal
on The Art, Science, and Engineering of Programming, vol. 3, no. 1][prog18],
art. 1, 33 pages, 2018.  
[![doi][prog18_doi]][prog18_paper] [![Preprint][preprint]][prog18_pdf]


## License

This work is released under the [MIT license][license].


[ci_badge]: https://img.shields.io/github/workflow/status/hpi-swa/polyglot-live-programming/CI.svg
[ci_url]: https://github.com/hpi-swa/polyglot-live-programming/actions?query=workflow%3ACI
[cop19_doi]: https://img.shields.io/badge/doi-10.1145/3340671.3343358-blue.svg
[cop19_paper]: https://doi.org/10.1145/3340671.3343358
[cop19_pdf]: http://hirschfeld.org/writings/media/ReinLinckeRamsonMattisNiephausHirschfeld_2019_ImplementingBabylonianSbyPuttingExamplesIntoContextsTracingInstrumentationForExampleBasedLiveProgrammingAsAUseCaseForContextOrientedProgramming_AcmDL.pdf
[cop19]: https://2019.ecoop.org/details/COP-2019-papers/9/Implementing-Babylonian-S-by-Putting-Examples-into-Contexts-Tracing-Instrumentation-
[demo_selection_probes]: https://user-images.githubusercontent.com/2368856/97712431-b6540480-1abe-11eb-9f73-efe7983ee3b9.gif
[graalvm_vscode]: https://www.graalvm.org/tools/vscode-extension/
[graalvm]: https://www.graalvm.org
[license]: https://github.com/hpi-swa/polyglot-live-programming/blob/master/LICENSE
[lsp]: https://microsoft.github.io/language-server-protocol/
[mplr19_doi]: https://img.shields.io/badge/doi-10.1145/3357390.3361024-blue.svg
[mplr19_paper]: https://doi.org/10.1145/3357390.3361024
[mplr19_pdf]: https://fniephaus.com/2019/mplr19-graalsqueak.pdf
[mplr19]: https://conf.researchr.org/home/mplr-2019
[onward20_doi]: https://img.shields.io/badge/doi-10.1145/3426428.3426919-blue.svg
[onward20_paper]: https://doi.org/10.1145/3426428.3426919
[onward20_pdf]: http://fniephaus.com/2020/onward20-live-programming.pdf
[onward20]: https://2020.splashcon.org/details/splash-2020-Onward-papers/7/Example-Based-Live-Programming-for-Everyone-Building-Language-agnostic-Tools-for-Liv
[preprint]: https://img.shields.io/badge/preprint-download-blue.svg
[prog18_doi]: https://img.shields.io/badge/doi-10.22152/programming--journal.org/2019/3/1-blue.svg
[prog18_paper]: https://doi.org/10.22152/programming-journal.org/2019/3/1
[prog18_pdf]: https://arxiv.org/pdf/1807.08578v1
[prog18]: https://programming-journal.org/2019/3/issue3/
[prog19_doi]: https://img.shields.io/badge/doi-10.22152/programming--journal.org/2019/3/9-blue.svg
[prog19_paper]: https://doi.org/10.22152/programming-journal.org/2019/3/9
[prog19_pdf]: https://arxiv.org/pdf/1902.00549v1
[prog19]: https://programming-journal.org/2019/3/issue3/
[vscode_extension]: https://marketplace.visualstudio.com/items?itemName=hpi-swa.polyglot-live-programming
[vsm_badge]: https://img.shields.io/badge/vs%20marketplace-download-brightgreen
