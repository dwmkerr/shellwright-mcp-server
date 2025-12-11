---
name: shellwright-architecture
description: Design architecture for Shellwright features following existing patterns
---

# Shellwright Architecture Skill

Design architecture for Shellwright MCP server features.

## Process

1. **Analyze current solution** - Examine existing code in `src/`
2. **Identify patterns** - Find reusable patterns in tools, lib, and types
3. **Design for reuse** - Extend existing components rather than creating new ones
4. **Enable incremental updates** - Design for phased delivery
5. **Flag one-way decisions** - Identify choices that are hard to reverse

## Principles

- **Reuse over creation** - Build on existing patterns
- **Follow existing idioms** - Match the codebase style
- **Incremental delivery** - Each phase independently mergeable
- **Reversibility** - Identify lock-in decisions requiring team input

## Output Requirements

- **Component diagram** - Show new pieces alongside existing ones
- **Data model** - Extend current types/interfaces
- **API design** - Follow existing MCP tool conventions
- **One-way decisions** - Choices requiring team alignment
- **Implementation phases** - Ordered for incremental delivery
