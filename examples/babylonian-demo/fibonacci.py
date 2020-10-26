# <Example :name="eight" n="8" />
def fibonacci(n):
    x = 0
    y = 1
    for i in range(n):
        z = x
        x = y
        y = z + y
    return x