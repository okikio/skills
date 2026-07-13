# Integration procedure

## Before editing

- locate the nearest owning manifest and lockfile;
- classify the repository as native, package-manager-first, or hybrid where the
  runtime makes that distinction relevant;
- inspect existing imports, wrappers, utilities, adapters, and conventions;
- identify generated files, publish metadata, and deployment consumers;
- establish the exact target versions and peer requirements;
- capture the current verification commands and a failing or missing behavior.

## Integrate the ecosystem, not just the import

Trace the capability through its complete path:

```text
manifest and version
  -> public import or adapter
  -> configuration and schema
  -> runtime owner
  -> observable behavior
  -> tests and generated surfaces
  -> build, package, and deployment
```

Update only the packages and connected surfaces the chosen capability requires.
Preserve framework and package-manager metadata that remains authoritative.

## Version and host matrix

Check the actual combinations the project claims:

- runtime and operating system;
- package and adapter versions;
- framework renderer and server adapter;
- bundler, compiler, or packaging target;
- database dialect and driver;
- development, test, CI, and production hosts.

Type compatibility is not runtime compatibility. API resemblance is not dialect
support. A package existing in the ecosystem is not proof that its adapter works
in the selected host.

## Verification levels

1. Static: imports, types, schemas, manifests, and generated metadata agree.
2. Targeted: the changed package and adapter tests pass.
3. Integration: the real connected workflow executes.
4. Consumer: a clean project can install, import, build, or connect.
5. Operational: failure, cleanup, rollback, and observability behave as claimed.

Report which levels ran. Never convert a registry delay or missing credential
into a passing result.
