---
sidebar_label: "User Stories API"
sidebar_position: 1
---

[**Tenor API Documentation**](../README.md)

***

# userStories

User Stories Router - Tenor API Endpoints for User Story Management

This file defines the TRPC router and procedures for managing user stories in the Tenor application.
It provides endpoints to create, read, update, delete, and generate user stories for projects.

The router includes procedures for:
- Creating and modifying user stories
- Retrieving user story details and table-friendly user story data
- Managing user story tags, dependencies, and relationships
- Generating user stories using AI based on project context and requirements
- Deleting user stories (soft delete)

User stories represent features or improvements from an end-user perspective and are core
elements in the Tenor agile project management workflow.

## Interfaces

- [UserStoryCol](interfaces/UserStoryCol.md)

## Variables

- [createUserStoryProcedure](variables/createUserStoryProcedure.md)
- [deleteUserStoryProcedure](variables/deleteUserStoryProcedure.md)
- [generateUserStoriesProcedure](variables/generateUserStoriesProcedure.md)
- [getAllUserStoryPreviewsProcedure](variables/getAllUserStoryPreviewsProcedure.md)
- [getProjectUserStoriesOverviewProcedure](variables/getProjectUserStoriesOverviewProcedure.md)
- [getUserStoriesTableFriendlyProcedure](variables/getUserStoriesTableFriendlyProcedure.md)
- [getUserStoryCountProcedure](variables/getUserStoryCountProcedure.md)
- [getUserStoryDetailProcedure](variables/getUserStoryDetailProcedure.md)
- [modifyUserStoryProcedure](variables/modifyUserStoryProcedure.md)
- [modifyUserStoryTagsProcedure](variables/modifyUserStoryTagsProcedure.md)
- [userStoriesRouter](variables/userStoriesRouter.md)
