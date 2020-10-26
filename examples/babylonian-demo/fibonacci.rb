# <Example :name="eight" n="8" />
def fibonacci(n)
    x = 0
    y = 1
    for i in 1..n
        # <Probe />
        z = x
        x = y
        y = z + y
    end
    # <Assertion :expected="21" />
    x
end