---
sidebar_label: "Kanban API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# kanban

Kanban Router - Tenor API Endpoints for Kanban Board Management

This file defines the TRPC router and procedures for managing Kanban board functionality in the Tenor application.
It provides endpoints to retrieve and organize tasks, user stories, and other backlog items for kanban board views.

The router includes procedures for:
- Retrieving tasks formatted for kanban display
- Getting backlog items organized by status for kanban columns
- Fetching user stories and issues with appropriate kanban metadata

Kanban functionality enables visual project management through card-based organization
of work items across different status columns.

## Variables

- [getBacklogItemsForKanbanProcedure](variables/getBacklogItemsForKanbanProcedure.md)
- [getItemAutomaticStatusProcedure](variables/getItemAutomaticStatusProcedure.md)
- [getTasksForKanbanProcedure](variables/getTasksForKanbanProcedure.md)
- [kanbanRouter](variables/kanbanRouter.md)
