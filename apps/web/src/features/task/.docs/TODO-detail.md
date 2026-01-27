# TODO List - タスク詳細画面 (todo-detail)

## Feature: Task Detail View

### Types Layer
- [ ] Define client-side types (Task detail types)
- [ ] Create type aliases for component props
- [ ] Add route parameter types

### API Client Layer
- [ ] Reuse existing Hono RPC client from todo-list
- [ ] Add getTaskById wrapper function (already exists in todo-list/api)
- [ ] Add updateTask wrapper function (already exists in todo-list/api)
- [ ] Add deleteTask wrapper function (already exists in todo-list/api)

### Stores Layer
- [ ] Create currentTask store (writable<Task | null>)
- [ ] Create isLoading store (writable<boolean>)
- [ ] Create error store (writable<string | null>)
- [ ] Create taskDetailStore with operations:
  - [ ] fetchById(id: string) - Load task details
  - [ ] updateField(field: string, value: any) - Update specific field
  - [ ] updateStatus(status: TaskStatus) - Update task status
  - [ ] deleteTask() - Delete current task
- [ ] Add optimistic updates with rollback on error

### Components Layer
- [ ] Create TaskDetailHeader.svelte
  - [ ] Display task title (editable inline)
  - [ ] Display task status badge (clickable to cycle)
  - [ ] Display "Back to list" button
  - [ ] Display "Delete" button with confirmation
- [ ] Create TaskDetailDescription.svelte
  - [ ] Display description (editable inline or via dialog)
  - [ ] Handle null description (show placeholder)
  - [ ] Save button for description changes
- [ ] Create TaskDetailMetadata.svelte
  - [ ] Display createdAt (formatted date/time)
  - [ ] Display updatedAt (formatted date/time)
  - [ ] Display task ID (for debugging/reference)
- [ ] Create TaskDetailActions.svelte
  - [ ] Edit button (toggle edit mode)
  - [ ] Delete button (with confirmation dialog)
  - [ ] Status change buttons/dropdown
- [ ] Create EditTaskDialog.svelte (if not using inline edit)
  - [ ] Form with title and description fields
  - [ ] Validation
  - [ ] Save/Cancel actions
- [ ] Create DeleteConfirmDialog.svelte
  - [ ] Confirmation message
  - [ ] Confirm/Cancel actions

### Pages Layer
- [ ] Create TaskDetailPage.svelte
  - [ ] Load task on mount using route parameter
  - [ ] Handle loading state (spinner)
  - [ ] Handle error state (404 not found)
  - [ ] Handle empty state
  - [ ] Compose all detail components
  - [ ] Handle navigation (back to list)

### Routing Integration
- [ ] Add route pattern (e.g., /tasks/:id)
- [ ] Set up route parameters
- [ ] Handle route navigation from task list
- [ ] Handle browser back button

### Testing
- [ ] Test task loading (valid ID)
- [ ] Test task loading (invalid ID - 404)
- [ ] Test inline editing
- [ ] Test status updates
- [ ] Test task deletion
- [ ] Test navigation (back to list)
- [ ] Test error scenarios (API failures)
- [ ] Test optimistic updates

### Integration
- [ ] Update App.svelte or router with detail route
- [ ] Add navigation from TaskCard (click to detail)
- [ ] Add navigation from TaskDetailPage (back to list)
- [ ] Test full user flow (list → detail → edit → back)

## Estimated Complexity

- **Files to create**: ~8-10 files
- **Files to modify**: 2-3 files (routing, navigation)
- **Estimated time**: 2-3 hours

## Dependencies

- Existing todo-list/api client (reuse)
- Existing todo-list/types (Task, TaskStatus)
- shadcn-svelte components (Button, Card, Dialog, Badge)
- Svelte stores pattern from todo-list

## Notes

- **Web-only feature** - No API changes needed (task endpoints already exist)
- **Reuse existing API**: todo-list already has all CRUD endpoints
- **Follow existing patterns**: Match todo-list store/component patterns
- **Routing**: Need to add client-side routing (currently SPA has no router)
