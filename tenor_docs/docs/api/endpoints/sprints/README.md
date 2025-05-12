---
sidebar_label: "Sprints API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# sprints

Sprints Router - Tenor API Endpoints for Sprint Management

This file defines the TRPC router and procedures for managing sprints in the Tenor application.
It provides endpoints to create, retrieve, and modify sprints and their associated backlog items.

The router includes procedures for:
- Creating and modifying sprints with start/end dates and descriptions
- Retrieving sprint details and overviews
- Managing backlog items (user stories and issues) associated with sprints
- Assigning and reassigning backlog items between sprints

Sprints represent time-boxed iterations in the agile development process where 
specific sets of tasks and user stories are worked on and completed.

## Variables

- [assignItemsToSprintProcedure](variables/assignItemsToSprintProcedure.md)
- [createOrModifySprintProcedure](variables/createOrModifySprintProcedure.md)
- [getBacklogItemPreviewsBySprintProcedure](variables/getBacklogItemPreviewsBySprintProcedure.md)
- [getProjectSprintsOverviewProcedure](variables/getProjectSprintsOverviewProcedure.md)
- [getSprintProcedure](variables/getSprintProcedure.md)
- [sprintsRouter](variables/sprintsRouter.md)

## Functions

- [getSprint](functions/getSprint.md)
- [timestampToDate](functions/timestampToDate.md)
