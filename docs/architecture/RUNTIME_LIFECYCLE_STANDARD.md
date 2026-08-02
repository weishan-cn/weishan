# Runtime Lifecycle Standard

INPUT -> NORMALIZE -> INTENT -> CAPABILITY_RESOLUTION -> CONFIRMATION -> EXECUTION_OR_READ_ONLY -> RESULT -> COMPLETE

For the current platform, EXECUTION_OR_READ_ONLY resolves only to read-only or dry-run behavior. A future execution path requires its own approval and must preserve Program 4 closed-gate invariants.