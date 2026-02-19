# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and testing.

## Workflows

### 1. Test UI (`test-ui.yml`)

Runs on pull requests that modify UI code or the workflow itself.

**Triggers:**
- Pull requests to `main` branch
- Only when files in `ui/` directory change
- Only for non-draft pull requests

**Steps:**
1. **Setup Environment**
   - Checkout code
   - Setup Node.js 18
   - Install pnpm 8.15.0
   - Cache pnpm store for faster builds

2. **Install Dependencies**
   - Install all dependencies with frozen lockfile

3. **Quality Checks**
   - Type checking (`pnpm type-check`)
   - Linting (`pnpm lint`)
   - Formatting check (`pnpm format:check`)

4. **Testing**
   - Run all tests with coverage (`pnpm test:coverage`)
   - Upload coverage to Codecov

5. **Build**
   - Build the project (`pnpm build`)

**Coverage Reporting:**
- Coverage reports are uploaded to Codecov
- Located at `ui/coverage/lcov.info`
- Flagged as `ui` coverage
- Non-blocking (doesn't fail CI if upload fails)

### 2. Test API (`test-api.yml`)

Runs on pull requests that modify API code.

**Triggers:**
- Pull requests to `main` branch
- Only when files in `api/` directory change

## Running Locally

You can run the same checks locally before pushing:

```bash
# For UI
cd ui
pnpm type-check
pnpm lint
pnpm format:check
pnpm test:coverage
pnpm build

# For API
cd api
uv run poe release
```

## Coverage Badges

You can add coverage badges to your README using Codecov:

```markdown
[![codecov](https://codecov.io/gh/USERNAME/REPO/branch/main/graph/badge.svg?flag=ui)](https://codecov.io/gh/USERNAME/REPO)
```

## Workflow Optimization

### Caching Strategy

The UI workflow uses pnpm store caching to speed up dependency installation:

- Cache key includes the hash of `pnpm-lock.yaml`
- Cache is restored across workflow runs
- Significantly reduces installation time

### Conditional Execution

Both workflows use path filters to only run when relevant files change:

- `ui/**` - Only run UI workflow when UI files change
- `api/**` - Only run API workflow when API files change

This saves CI resources and speeds up feedback time.

### Parallel Execution

The workflows run quality checks in sequence for clear feedback:

1. Type check (catches TypeScript errors)
2. Linting (catches code quality issues)
3. Formatting (catches style issues)
4. Tests (catches functional issues)
5. Build (catches build issues)

This order ensures fast feedback on the most common issues first.

## Required Checks

To make these workflows required for merging:

1. Go to repository Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select the workflows as required checks

## Troubleshooting

### Workflow Not Running

- Check that the PR is not in draft mode
- Verify that changed files match the path filters
- Check that the PR targets the `main` branch

### Dependency Installation Fails

- Clear the pnpm cache in Actions settings
- Verify `pnpm-lock.yaml` is committed
- Check Node.js version matches local environment

### Tests Failing in CI but Passing Locally

- Ensure all environment variables are set in CI
- Check for timing-dependent tests
- Verify test isolation (no shared state between tests)

### Coverage Upload Fails

- Coverage upload failures don't block the workflow
- Check Codecov integration is properly configured
- Verify the coverage file path is correct

## Best Practices

1. **Keep workflows fast**: Use caching and parallel execution
2. **Fail fast**: Run quick checks before slow ones
3. **Clear feedback**: Use descriptive step names
4. **Version pins**: Pin action versions for reproducibility
5. **Cache wisely**: Cache dependencies but not build artifacts
6. **Test locally**: Run checks locally before pushing

## Maintenance

### Updating Dependencies

When updating workflow dependencies:

```yaml
# Update Node.js version
- uses: actions/setup-node@v4
  with:
    node-version: "20"  # Update here

# Update pnpm version
- uses: pnpm/action-setup@v4
  with:
    version: 9.0.0  # Update here
```

### Adding New Checks

To add a new quality check:

1. Add the script to `package.json`
2. Add a new step in the workflow:

```yaml
- name: Run new check
  run: pnpm run new-check
```

### Modifying Triggers

To change when workflows run:

```yaml
on:
  pull_request:
    branches:
      - main
      - develop  # Add more branches
    paths:
      - "ui/**"
      - "shared/**"  # Add more paths
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm Action Setup](https://github.com/pnpm/action-setup)
- [Codecov GitHub Action](https://github.com/codecov/codecov-action)
- [Node.js Setup Action](https://github.com/actions/setup-node)