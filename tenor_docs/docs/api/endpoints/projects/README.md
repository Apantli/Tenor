---
sidebar_label: "Projects API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# projects

Projects Router - Tenor API Endpoints for Project Management

This file defines the TRPC router and procedures for project management in the Tenor application.
It provides endpoints to create, read, update, and delete projects, as well as manage their configurations.

The router includes procedures for:
- Creating new projects with default settings
- Listing projects associated with a user
- Managing project configurations including name, description, and logo
- Retrieving project information and user roles
- Deleting projects (soft delete)

Projects are the central organizational unit in Tenor, containing user stories, tasks, epics, and other items.

## Variables

- [createProjectProcedure](variables/createProjectProcedure.md)
- [deleteProjectProcedure](variables/deleteProjectProcedure.md)
- [getGeneralConfigProcedure](variables/getGeneralConfigProcedure.md)
- [getProjectNameProcedure](variables/getProjectNameProcedure.md)
- [getUserTypesProcedure](variables/getUserTypesProcedure.md)
- [listProjectsProcedure](variables/listProjectsProcedure.md)
- [modifyGeneralConfigProcedure](variables/modifyGeneralConfigProcedure.md)
- [projectsRouter](variables/projectsRouter.md)

## Functions

- [createEmptyProject](functions/createEmptyProject.md)
- [emptyRequeriment](functions/emptyRequeriment.md)
