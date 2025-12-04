# Phase 8: Animations & Transitions Guide

## Overview
This guide explains how to use the new animation components created in Phase 8.

## Components

### 1. AnimatedScreen
**Purpose**: Provides smooth slide/fade transitions between tab screens

**Usage**:
```jsx
import AnimatedScreen from './components/AnimatedScreen';

<AnimatedScreen active={activeTab === 'dashboard'} direction="horizontal">
  <YourScreenContent />
</AnimatedScreen>
```

**Props**:
- `active` (boolean): Whether this screen is currently active
- `direction` ('horizontal' | 'vertical'): Animation direction
- `children`: Screen content

---

### 2. AnimatedCard
**Purpose**: Adds scale and glow effects to cards on press

**Usage**:
```jsx
import AnimatedCard from './components/AnimatedCard';

<AnimatedCard
  onPress={() => handlePress()}
  glowColor={COLORS.accent.primary}
  style={styles.card}
>
  <YourCardContent />
</AnimatedCard>
```

**Props**:
- `onPress`: Press handler
- `onLongPress`: Long press handler (optional)
- `glowColor`: Color for glow effect (optional)
- `disabled`: Disable interactions
- `style`: Card styles

---

### 3. AnimatedButton
**Purpose**: Enhanced button with scale and glow effects

**Usage**:
```jsx
import AnimatedButton from './components/AnimatedButton';

<AnimatedButton
  variant="primary" // 'primary', 'secondary', 'danger', 'success'
  onPress={() => handlePress()}
  glowColor={COLORS.accent.primary}
>
  <Text>Button Text</Text>
</AnimatedButton>
```

**Props**:
- `variant`: Button style variant
- `onPress`: Press handler
- `glowColor`: Custom glow color (optional)
- `disabled`: Disable button
- `style`: Button styles

---

### 4. SwipeableCard
**Purpose**: Enables swipe gestures for actions (complete, delete)

**Usage**:
```jsx
import SwipeableCard from './components/SwipeableCard';

<SwipeableCard
  onSwipeRight={() => handleComplete()}
  onSwipeLeft={() => handleDelete()}
  rightActionColor={COLORS.accent.success}
  leftActionColor={COLORS.accent.danger}
>
  <YourCardContent />
</SwipeableCard>
```

**Props**:
- `onSwipeRight`: Handler for right swipe (complete)
- `onSwipeLeft`: Handler for left swipe (delete)
- `rightActionColor`: Color for right action background
- `leftActionColor`: Color for left action background
- `rightIcon`: Icon name for right action
- `leftIcon`: Icon name for left action
- `disabled`: Disable swipe gestures

---

### 5. CustomRefreshControl
**Purpose**: RPG-themed pull-to-refresh animation

**Usage**:
```jsx
import CustomRefreshControl from './components/CustomRefreshControl';

// Note: This is a visual component, not a direct replacement for RefreshControl
// Use it in your refresh control implementation
<CustomRefreshControl refreshing={refreshing} progress={pullProgress} />
```

**Props**:
- `refreshing`: Whether refresh is in progress
- `progress`: Pull progress (0-1)

---

### 6. SkeletonLoader
**Purpose**: RPG-themed skeleton loading placeholders

**Usage**:
```jsx
import { SkeletonLoader, SkeletonCard, SkeletonQuestCard } from './components/SkeletonLoader';

// Basic skeleton
<SkeletonLoader width="100%" height={20} borderRadius={8} />

// Pre-configured card skeleton
<SkeletonCard />

// Pre-configured quest card skeleton
<SkeletonQuestCard />
```

**Props**:
- `width`: Width (number or '100%')
- `height`: Height
- `borderRadius`: Border radius
- `variant`: 'default', 'card', 'circle'
- `style`: Additional styles

---

### 7. XpProgressIndicator
**Purpose**: XP bar style progress indicator

**Usage**:
```jsx
import XpProgressIndicator from './components/XpProgressIndicator';

// Determinate progress
<XpProgressIndicator progress={0.65} label="Loading quests..." />

// Indeterminate progress
<XpProgressIndicator indeterminate label="Loading..." />
```

**Props**:
- `progress`: Progress value (0-1) for determinate mode
- `indeterminate`: Use indeterminate animation
- `label`: Label text
- `showLabel`: Show/hide label
- `style`: Additional styles

---

## Integration Examples

### Quest Card with Swipe
```jsx
import SwipeableCard from './components/SwipeableCard';
import AnimatedCard from './components/AnimatedCard';

<SwipeableCard
  onSwipeRight={() => handleCompleteQuest(quest)}
  onSwipeLeft={() => handleDeleteQuest(quest)}
>
  <AnimatedCard
    onPress={() => openQuestModal(quest)}
    glowColor={getArcColor(quest.arcId)}
  >
    <QuestCardContent quest={quest} />
  </AnimatedCard>
</SwipeableCard>
```

### Loading State
```jsx
import { SkeletonQuestCard } from './components/SkeletonLoader';
import XpProgressIndicator from './components/XpProgressIndicator';

{loading ? (
  <>
    <XpProgressIndicator indeterminate label="Loading quests..." />
    <SkeletonQuestCard />
    <SkeletonQuestCard />
    <SkeletonQuestCard />
  </>
) : (
  <QuestList quests={quests} />
)}
```

### Button with Animation
```jsx
import AnimatedButton from './components/AnimatedButton';

<AnimatedButton
  variant="primary"
  onPress={() => handleCompleteQuest()}
>
  <Text style={styles.buttonText}>Complete Quest</Text>
</AnimatedButton>
```

---

## Performance Notes

- All animations use `useNativeDriver: true` where possible for better performance
- Skeleton loaders are lightweight and don't impact performance
- SwipeableCard uses PanResponder for smooth gesture handling
- Screen transitions are optimized to only render active screens

---

## Best Practices

1. **Use AnimatedCard** for interactive cards that need visual feedback
2. **Use SwipeableCard** for quest/arc cards that support swipe actions
3. **Use SkeletonLoader** during initial data loading
4. **Use XpProgressIndicator** for long-running operations
5. **Combine components** for enhanced UX (e.g., SwipeableCard + AnimatedCard)

---

## Future Enhancements

- Add haptic feedback to swipe gestures
- Add sound effects for actions
- Add particle effects for completions
- Add spring physics to card interactions

