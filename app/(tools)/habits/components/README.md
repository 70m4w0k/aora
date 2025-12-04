# RPG UI Components

This directory contains RPG-style UI components for the Habits Tracker.

## Components

### RPGButton
RPG-style button component with multiple variants and animations.

**Props:**
- `title` (string): Button text
- `onPress` (function): Press handler
- `variant` ('primary' | 'secondary' | 'danger' | 'success' | 'outline'): Button style
- `size` ('small' | 'medium' | 'large'): Button size
- `icon` (string): Ionicons icon name
- `iconPosition` ('left' | 'right'): Icon position
- `disabled` (boolean): Disable button
- `loading` (boolean): Show loading state
- `fullWidth` (boolean): Full width button

**Example:**
```jsx
import RPGButton from './components/RPGButton';

<RPGButton
  title="Complete Quest"
  variant="primary"
  icon="checkmark-circle"
  onPress={handleComplete}
/>
```

### Badge
Badge component for displaying levels, streaks, rarity, and status.

**Props:**
- `type` ('level' | 'streak' | 'rarity' | 'status' | 'default'): Badge type
- `value` (number | string): Badge value
- `label` (string): Badge label
- `size` ('small' | 'medium' | 'large'): Badge size
- `color` (string): Custom color
- `icon` (string): Ionicons icon name

**Example:**
```jsx
import Badge from './components/Badge';

<Badge type="level" value={25} />
<Badge type="streak" value={7} />
<Badge type="rarity" value="Epic" color={COLORS.rarity.epic} />
```

### RPGModal
RPG-style modal component with animations and themed borders.

**Props:**
- `visible` (boolean): Modal visibility
- `onClose` (function): Close handler
- `title` (string): Modal title
- `icon` (string): Ionicons icon name
- `variant` ('default' | 'quest' | 'arc' | 'tier'): Modal theme
- `animationType` ('slide' | 'fade' | 'scale'): Animation type
- `fullScreen` (boolean): Full screen modal

**Example:**
```jsx
import RPGModal from './components/RPGModal';

<RPGModal
  visible={visible}
  onClose={handleClose}
  title="Quest Details"
  icon="scroll-outline"
  variant="quest"
>
  {/* Modal content */}
</RPGModal>
```

### CircularProgress
Circular progress indicator with animations.

**Props:**
- `progress` (number): Progress 0-100
- `size` (number): Circle size
- `strokeWidth` (number): Stroke width
- `color` (string): Progress color
- `gradient` (array): Gradient colors
- `showPercentage` (boolean): Show percentage
- `label` (string): Label text

**Example:**
```jsx
import CircularProgress from './components/CircularProgress';

<CircularProgress
  progress={75}
  size={100}
  color={COLORS.accent.primary}
  showPercentage={true}
/>
```

### StatCard
RPG-style dashboard widget for statistics.

**Props:**
- `title` (string): Card title
- `value` (string | number): Stat value
- `label` (string): Stat label
- `icon` (string): Ionicons icon name
- `iconColor` (string): Icon color
- `progress` (number): Circular progress 0-100
- `trend` ({ value: number, isPositive: boolean }): Trend data
- `onPress` (function): Press handler

**Example:**
```jsx
import StatCard from './components/StatCard';

<StatCard
  title="This Week"
  value={42}
  label="Completions"
  icon="calendar"
  trend={{ value: 15, isPositive: true }}
/>
```

### XPBar
Enhanced XP progress bar with animations and milestones.

**Props:**
- `currentXP` (number): Current XP
- `xpForNextLevel` (number): XP needed for next level
- `xpForCurrentLevel` (number): XP for current level
- `level` (number): Current level
- `animated` (boolean): Enable animations
- `showText` (boolean): Show text
- `showMilestones` (boolean): Show milestone markers
- `height` (number): Bar height

**Example:**
```jsx
import XPBar from './components/XPBar';

<XPBar
  currentXP={750}
  xpForNextLevel={1000}
  xpForCurrentLevel={500}
  level={5}
  showMilestones={true}
/>
```

## Usage

Import components individually or use the UI index:

```jsx
import { RPGButton, Badge, RPGModal } from './components/ui';
```

