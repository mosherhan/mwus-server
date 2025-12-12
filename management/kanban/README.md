# Kanban Board Module

A self-contained, Vanilla JS Kanban board implementation using ES Modules.

## Structure

- `board.js`: Main entry point. Initializes the board, handles state and filtering.
- `column.js`: Renders a column and its header.
- `card.js`: Renders individual project cards.
- `dnd.js`: Helper for native HTML5 Drag and Drop interactions.
- `api.js`: Mock API service for fetching/updating projects.
- `style.css`: Scoped styles for the board (uses global CSS variables).

## Usage

1. **Include Styles**:
   ```html
   <link rel="stylesheet" href="kanban/style.css">
   ```

2. **Mount Point**:
   Create a container element with the ID `kanban-root`:
   ```html
   <div id="kanban-root"></div>
   ```

3. **Initialize**:
   Import `board.js` as a module. It will automatically find `#kanban-root` and render.
   ```html
   <script type="module" src="kanban/board.js"></script>
   ```

## Customization

- **Columns**: Defined in `board.js` `COLUMNS` array.
- **API**: Modify `api.js` to connect to a real backend instead of localStorage.
- **Styling**: `style.css` relies on CSS variables (`--panel`, `--text`, etc.) defined in the parent `index.html`.

## API Contract

The `api.js` module exports:

- `fetchProjects()`: Returns Promise<Array<Project>>
- `updateProject(id, updates)`: Returns Promise<Project>

### Project Type
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  status: 'YET_TO_START' | 'IN_PROGRESS' | 'ADMIN_REVIEW' | 'DONE' | 'DEPLOYED';
  owner: string[]; // Array of initials
  priority: 'P0' | 'P1' | 'P2';
  dueDate: string; // ISO Date
  taskCount: number;
  isBlocked: boolean;
  order: number;
}
```
