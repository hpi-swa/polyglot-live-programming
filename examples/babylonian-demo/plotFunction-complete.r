library(lattice)
eval.polyglot(path = 'babylonian-demo/fibonacci-complete.js')

# <Example :name="fib" func="import('fibonacci')" start="0" end="20" />
plotFunction <- function(func, start, end) {
  x <- seq(from = start, to = end, by = 1)
  # <Probe />
  y <- lapply(x, (function(n) func(n)))
  svg()
  print(xyplot(y ~ x, type="p", cex=2, pch=16))
  grDevices:::svg.off()
}
 