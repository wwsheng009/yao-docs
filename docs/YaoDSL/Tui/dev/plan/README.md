# TUI Operation Plans

This directory contains operation plans for complex TUI development tasks. Each plan documents the requirements, implementation strategy, testing approach, and approval status for significant features or changes.

## Directory Structure

```
tui/docs/plan/
├── README.md                    # This file - plan index and status
├── active/                      # Currently active plans
│   └── [feature-name]-plan-[YYYY-MM-DD].md
└── completed/                   # Completed/archived plans
    └── [feature-name]-plan-[YYYY-MM-DD].md
```

## Plan Documentation

Each operation plan follows a standardized template covering:

- **Overview**: Request type, priority, estimated time, and risk level
- **Requirements Analysis**: User intent, technical requirements, success criteria
- **Impact Assessment**: Affected components, files, breaking changes
- **Implementation Plan**: Phased approach with specific tasks
- **Testing Strategy**: Unit tests, integration tests, manual testing
- **Risk Mitigation**: Identified risks and rollback plans
- **Success Criteria**: Checklist for completion
- **Dependencies**: External and internal dependencies
- **Documentation Updates**: Required documentation changes
- **Approval Record**: Creation date, reviewer, approval status

## Current Plans

### Active Plans

- **Example Component Plan** (`active/example-component-plan-2024-01-21.md`)
  - Status: Draft
  - Purpose: Demonstrates the operation plan workflow and serves as a template
  - Created: 2024-01-21

### Completed Plans

No completed plans yet.

## Plan Status

Each plan can have the following statuses:

- **Draft**: Plan is being created or revised
- **Pending Review**: Plan is ready for user review
- **Approved**: Plan has been approved and is being executed
- **In Progress**: Implementation is underway
- **Completed**: Plan has been fully implemented and tested
- **Cancelled**: Plan was cancelled or superseded

## Creating a New Plan

When a complex TUI development task is identified, the tui-developer agent will:

1. Perform feature review and complexity assessment
2. Create an operation plan using the standard template
3. Present the plan to the user for approval
4. After approval, create plan document in `active/` directory
5. Execute implementation according to the plan
6. Update plan status as work progresses
7. Move to `completed/` when finished

## Naming Convention

Use the following naming convention for plan documents:

```
[feature-name]-plan-[YYYY-MM-DD].md
```

Examples:

- `table-component-plan-2024-01-15.md`
- `focus-management-refactor-plan-2024-01-20.md`
- `chat-component-enhancement-plan-2024-01-25.md`

## Review Process

Before execution, all complex plans must:

1. Be reviewed by the user
2. Receive explicit approval
3. Have clear success criteria defined
4. Have risk mitigation strategies identified
5. Have testing strategy documented

## Tracking Progress

Each plan should be updated as work progresses:

- Mark completed tasks with `[x]`
- Update estimated time if needed
- Document any deviations from the plan
- Record lessons learned
- Update approval record

## Best Practices

1. **Clarity**: Plans should be clear and specific about what will be done
2. **Realistic**: Time estimates should be realistic and account for testing
3. **Complete**: Include all aspects: implementation, testing, documentation
4. **Flexible**: Allow for adjustments as new information emerges
5. **Tracked**: Keep the plan updated throughout implementation
6. **Archived**: Move completed plans to maintain a history of changes

## Related Documentation

- [TUI Developer Guide](../../.opencode/agent/tui-developer.md) - Complete TUI development documentation
- [Feature Review Workflow](../../.opencode/agent/tui-developer.md#feature-review-and-planning-workflow) - Detailed review process

## Questions or Issues

For questions about operation plans or the review process, refer to the TUI Developer Guide or consult with the development team.
