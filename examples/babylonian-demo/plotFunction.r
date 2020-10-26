library(lattice)

plotFunction <- function(func, start, end) {
  x <- seq(from = start, to = end, by = 1)
  # <Probe />
  y <- lapply(x, (function(n) func(n)))
  svg()
  print(xyplot(y ~ x, type="p", cex=2, pch=16))
  grDevices:::svg.off()
}
