# Shopping List Improvements Plan

## 🐛 Bug Fix: Duplicate Category Filters

### Problem
There are two category configurations:
1. `SHOPPING_CATEGORIES_CONFIG` (lines 33-38) - Used in modal and item cards ✅ **KEEP THIS**
2. `SHOPPING_CATEGORY_CONFIG` (lines 42-47) - Unused duplicate ❌ **REMOVE**

There are also two sets of category filters:
1. **Category chips for quick-add** (lines 431-436, 492-521) - With icons ✅ **KEEP THIS**
2. **Category tabs for filtering** (lines 387-428) - Without icons ❌ **UPDATE TO USE ICONS**

### Solution
1. Remove `SHOPPING_CATEGORY_CONFIG` (unused duplicate)
2. Update `renderCategoryTabs()` to use icons from `SHOPPING_CATEGORIES_CONFIG`
3. Ensure consistent styling between quick-add chips and filter tabs

---

## ✨ New Features

### 1. Sorting Functionality

#### Sort Options:
- **Name** (A-Z, Z-A)
- **Date Added** (Newest first, Oldest first)
- **Category** (Group by category)
- **Assigned To** (Group by user)
- **Completion Status** (Completed first, Pending first)

#### Implementation:
- Add sort dropdown/button in header (next to filter toggle)
- Store sort preference in state
- Apply sorting to `filteredItems` before rendering
- Show active sort indicator

#### UI Design:
```
Header:
[Title]                    [👁️] [🔽 Sort]
```

Sort Modal/Dropdown:
- Modal with radio buttons or dropdown
- Current sort highlighted
- Apply on selection

---

### 2. Shopping History

#### Features:
- Track completed items with completion timestamp
- View history of all completed items
- Restore items from history (add back to active list)
- Filter history by date range, category, user
- Clear old history (optional)

#### Data Structure:
- Use existing `completed` field
- Use `$updatedAt` for completion timestamp (when `completed` changes to `true`)
- Optionally add `completedAt` field in Appwrite for explicit tracking

#### UI Design:
- Add "History" button/tab in header
- History view shows:
  - Completed items grouped by date
  - Item name, category, who completed it, when
  - Restore button for each item
  - Clear history option

#### Implementation Steps:
1. Add history view/modal
2. Fetch completed items (filter by `completed: true`)
3. Group by date (Today, Yesterday, This Week, Older)
4. Add restore functionality (set `completed: false`, update `$updatedAt`)
5. Add clear history (delete or archive old completed items)

---

## 📋 Implementation Checklist

### Phase 1: Bug Fix
- [ ] Remove `SHOPPING_CATEGORY_CONFIG` duplicate
- [ ] Update `renderCategoryTabs()` to use icons
- [ ] Ensure consistent styling with quick-add chips
- [ ] Test category filtering works correctly

### Phase 2: Sorting
- [ ] Add sort state (`sortBy`, `sortOrder`)
- [ ] Create sort dropdown/modal UI
- [ ] Implement sort functions:
  - [ ] Sort by name
  - [ ] Sort by date
  - [ ] Sort by category
  - [ ] Sort by assigned to
  - [ ] Sort by completion status
- [ ] Apply sorting to filtered items
- [ ] Add visual indicator for active sort

### Phase 3: History
- [ ] Add history view/modal component
- [ ] Fetch completed items from database
- [ ] Group completed items by date
- [ ] Display history with restore option
- [ ] Implement restore functionality
- [ ] Add clear history option (optional)
- [ ] Add history filters (date range, category, user)

---

## 🎨 UI/UX Considerations

### Sorting UI:
- Use dropdown or modal (similar to expenses modal style)
- Icon: `swap-vertical` or `funnel`
- Position: Header right side, next to filter toggle
- Show current sort: "Sorted by: Name ↑"

### History UI:
- Button: "History" in header or as tab
- Modal/View: Full-screen or bottom sheet
- Group by: Date sections (Today, Yesterday, This Week, Older)
- Item card: Show name, category icon, completed by, date
- Actions: Restore button, delete button

### Consistency:
- Match existing modal styles (expenses modal style)
- Use same color scheme and spacing
- Maintain dark theme consistency

---

## 🔧 Technical Details

### Sort Implementation:
```javascript
const sortItems = (items, sortBy, sortOrder) => {
  const sorted = [...items].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'date':
        return sortOrder === 'asc'
          ? new Date(a.$createdAt) - new Date(b.$createdAt)
          : new Date(b.$createdAt) - new Date(a.$createdAt);
      // ... other cases
    }
  });
  return sorted;
};
```

### History Implementation:
```javascript
// Fetch completed items
const completedItems = items.filter(item => item.completed);

// Group by date
const groupByDate = (items) => {
  const today = new Date();
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: []
  };
  // ... grouping logic
  return groups;
};
```

---

## 📝 Notes

- Keep existing quick-add functionality intact
- Maintain performance with large lists (use FlatList optimizations)
- Consider adding search functionality in future
- History could be archived after 30 days (optional)
- Consider adding "Recently Completed" quick view

