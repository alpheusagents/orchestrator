set shell := ["bash", "-cu"]
set windows-shell := ["pwsh", "-Command"]

oxfmt := "pnpm exec oxfmt"
oxlint := "pnpm exec oxlint"

# Default action
_:
    just --list -u

# Install
i:
    pnpm install

# Format code
fmt:
    {{oxfmt}}

# Lint code with ls-lint
ls-lint:
    ls-lint -config ./.ls-lint.yaml

# Lint code with ls-lint
lslint: ls-lint

# Lint code with typos
typos:
    typos

# Lint code
lint:
    {{oxlint}} --fix --fix-suggestions --fix-dangerously

# Check code
check: fmt ls-lint typos lint

# Clean
clean:
    pnpm clean
