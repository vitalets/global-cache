# Development

## Dev command

To keep dependent packages in sync, run this command in the background:
```
pnpm run dev
```

## Testing

Run all tests:
```
pnpm test
```

Run tests for `core`:
```
turbo run test --filter='./packages/core'
```

Run tests for `playwright`:
```
turbo run test --filter='./packages/playwright'
```