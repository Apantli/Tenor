---
sidebar_label: "Kanban API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# kanban

Kanban Router - Tenor API Endpoints for Kanban Board Management

This file defines the TRPC router and procedures for managing Kanban boards in the Tenor application.
It provides endpoints to retrieve and organize tasks and backlog items in a board layout.

The router includes procedures for:
- Getting tasks formatted for Kanban board display
- Getting backlog items (user stories and issues) for Kanban display
- Creating new status lists (columns) for the Kanban board
- Determining automatic status for items based on their tasks' statuses

Kanban boards provide visual management of tasks and backlog items organized by status,
allowing teams to visualize workflow and track progress.

## Interfaces

- [KanbanCard](interfaces/KanbanCard.md)
- [KanbanItemCard](interfaces/KanbanItemCard.md)
- [KanbanTaskCard](interfaces/KanbanTaskCard.md)

## Variables

- [createStatusListProcedure](variables/createStatusListProcedure.md)
- [getBacklogItemsForKanbanProcedure](variables/getBacklogItemsForKanbanProcedure.md)
- [getItemAutomaticStatusProcedure](variables/getItemAutomaticStatusProcedure.md)
- [getTasksForKanbanProcedure](variables/getTasksForKanbanProcedure.md)
- [kanbanRouter](variables/kanbanRouter.md)
