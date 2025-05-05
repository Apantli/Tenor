---
sidebar_label: "Tasks API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# tasks

Tasks Router - Tenor API Endpoints for Task Management

This file defines the TRPC router and procedures for task management in the Tenor application.
It provides endpoints to create, read, update, delete, and generate tasks for projects and backlog items.

The router includes procedures for:
- Creating and modifying tasks
- Retrieving task details and table-friendly task data
- Changing task status
- Deleting tasks (soft delete)
- Generating tasks using AI based on backlog items
- Getting task counts

Tasks are organized under projects and can be associated with user stories, issues, or other items.

## Interfaces

- [TaskCol](interfaces/TaskCol.md)

## Variables

- [changeTaskStatusProcedure](variables/changeTaskStatusProcedure.md)
- [createTaskProcedure](variables/createTaskProcedure.md)
- [deleteTaskProcedure](variables/deleteTaskProcedure.md)
- [generateTasksProcedure](variables/generateTasksProcedure.md)
- [getTaskCountProcedure](variables/getTaskCountProcedure.md)
- [getTaskDetailProcedure](variables/getTaskDetailProcedure.md)
- [getTasksTableFriendlyProcedure](variables/getTasksTableFriendlyProcedure.md)
- [modifyTaskProcedure](variables/modifyTaskProcedure.md)
- [tasksRouter](variables/tasksRouter.md)

## Functions

- [getStatusTag](functions/getStatusTag.md)
- [getTasksFromItem](functions/getTasksFromItem.md)
- [getTasksFromProject](functions/getTasksFromProject.md)
- [getTodoStatusTag](functions/getTodoStatusTag.md)
