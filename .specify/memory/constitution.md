# Project Constitution

## Core Principles

1. **Test-First Development** - All features must have tests before implementation
2. **Specification-Driven** - All changes must be documented in SPEC.md before code
3. **Incremental Delivery** - Small, frequent releases over large batches
4. **Automated Verification** - CI/CD must pass before any merge
5. **Documentation as Code** - Docs live next to the code they describe

## Decision Framework

When facing technical choices:
1. Does this align with our core principles?
2. What's the smallest experiment to validate this?
3. How will we verify this works?
4. What could go wrong and how will we know?

## Review Checklist

Before any PR:
- [ ] Tests written first (TDD)
- [ ] Specification updated
- [ ] Code follows conventions
- [ ] CI/CD passes
- [ ] Documentation updated