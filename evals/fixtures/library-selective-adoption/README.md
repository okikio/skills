# Selective adoption fixture

The root package should expose the core facade without importing the browser
adapter. The browser adapter must remain available from an explicit public
subpath. Importing either entrypoint must not mutate global state.
