# Streaming cleanup fixture

`collectItems()` must return an async iterable. It should acquire the resource
only when iteration begins, read one item at a time, stop producing after the
consumer breaks, and dispose through `Symbol.asyncDispose` exactly once.
