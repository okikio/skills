# CLI output

The result stream currently includes diagnostics and cannot be piped safely.

| Channel | Owner | Destination |
| :--- | ---: | :---: |
| Result | `kaiju.result` | stdout |
| Diagnostics | `kaiju.*` | stderr |

```text
result -> stdout
diagnostic -> stderr
```
