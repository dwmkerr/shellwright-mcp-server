# Shellwright AI Development Protocol

This guide describes how to complete tasks in Shellwright. We follow a simple approach where each step is broken down - understanding intent, design, verification, iteration, development and testing and then final review. Many team members may provide input at each step.

You can start by copying the template at `./tasks/00-template`.

## How we work

### 1. Objectives
Understand intent and objectives. Work with the user to understand their goals. Wait for review and approval before proceeding.

### 2. Architecture
Design the architecture that enables the objectives. Wait for review and approval before proceeding.

### 3. Verifiable Prototype
Build a prototype that can be interacted with programmatically, via APIs or interfaces. This allows us to verify design decisions and iterate on architecture and objectives.

**Checkpoint Loop:**

Each checkpoint is a dated journal entry in `03-verifiable-prototype.md`:

```markdown
## Checkpoint: 2024-01-15 10:30

### Goal
What this iteration aimed to achieve.

### Verification
Steps to test (bash, curl, dashboard instructions).

### Results
User's testing experience and observations.

### Feedback
What worked, what didn't, questions raised.

### Next Steps
Changes to make for next iteration.
```

The loop:
1. **Build** → Implement iteration
2. **Document** → Add checkpoint with goal and verification steps
3. **Test** → User tests and records results/feedback
4. **Respond** → Add next steps, update architecture if needed
5. **Commit** → Ask user if ready to commit with message `checkpoint/01-name`
6. **Repeat** → Implement next steps, create new checkpoint

The checkpoints form a development journal showing how the prototype evolved. Commits keep the journal in version control.

### 4. Production
Finalize code quality, add tests, documentation. Handled by shellwright-technical-lead agent.

## Agents

| Agent | Role |
|-------|------|
| `shellwright-architect` | Design architecture following existing patterns |
| `shellwright-prototyper` | Build minimal working prototypes with checkpoints |
| `shellwright-technical-lead` | Finalize code quality, tests, documentation |
