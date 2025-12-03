# Habits Tracker (RPG-Style) - Implementation Plan

## 📚 NEOSYSTEM Overview

Based on the guide, NEOSYSTEM is a gamification system that transforms personal development into an RPG-style game with:

### Core Concepts:

1. **Quests (Quêtes)** 
   - Concrete, repeatable actions (habits, tasks)
   - Must be quantifiable (number, frequency) or binary (yes/no)
   - Examples: "Meditate 1x per day", "Run 4x per week", "Post 1 video per day"
   - Reward: XP per completion

2. **Tiers/Milestones (Paliers)**
   - Unique achievements marking major progress
   - Not repeatable (unlike quests)
   - Examples: "100 days of meditation", "Run a marathon", "10K Instagram followers"
   - Reward: XP + Class Titles

3. **Arcs**
   - Categories/life domains for organizing quests and tiers
   - Examples: Mental, Physical/Sport, Finance, Business/Work, Social, Couple, Family, Health
   - Each arc can have multiple quests (up to 32+)
   - Progress tracked per arc

4. **Classes**
   - Character classes (e.g., "MARCHAND" - Merchant, "HOMME" - Man)
   - Each class has unique descriptions and characteristics
   - Titles unlocked based on tiers achieved

5. **XP & Levels**
   - Experience points earned from completing quests and tiers
   - Level progression (linear or progressive)
   - Global level + per-arc progress

6. **Penalty System (Malus)**
   - Optional system for missing quest recurrences
   - Can be active or inactive

---

## 🎮 Features to Implement

### Phase 1: Core Structure

#### 1.1 Arcs Management
- [ ] Create/edit/delete arcs
- [ ] Assign color/icon to each arc
- [ ] View arc progress and stats
- [ ] Arc list/grid view

#### 1.2 Quests Management
- [ ] Create quests with:
  - Name
  - Arc assignment
  - Frequency (Daily, Weekly, Monthly, Annual, Unique)
  - Repetition per period (e.g., 3x per week)
  - Intensity/Difficulty (1-5 scale)
  - XP per completion
  - Access level (optional)
- [ ] Edit/delete quests
- [ ] Mark quests as complete
- [ ] Track quest streaks
- [ ] Auto-reset based on frequency

#### 1.3 Tiers/Milestones Management
- [ ] Create tiers with:
  - Name
  - Arc assignment
  - Target value/condition
  - XP reward
  - Class title reward (optional)
- [ ] Track tier progress
- [ ] Mark tiers as achieved
- [ ] Unlock class titles

#### 1.4 Class System
- [ ] Define character classes
- [ ] Class descriptions and characteristics
- [ ] Title progression (11 titles based on tiers achieved)
- [ ] Visual representation

### Phase 2: Progress Tracking

#### 2.1 Daily Tracking
- [ ] Daily quest checklist
- [ ] Quick complete buttons
- [ ] Streak indicators
- [ ] Missed quest notifications

#### 2.2 Progress Visualization
- [ ] XP bar (global + per arc)
- [ ] Level display
- [ ] Progress charts/graphs
- [ ] Streak calendar view
- [ ] Completion statistics

#### 2.3 Penalty System
- [ ] Track missed recurrences
- [ ] Apply penalties (if active)
- [ ] Manual override option

### Phase 3: Gamification Elements

#### 3.1 XP & Leveling
- [ ] Calculate XP from quests/tiers
- [ ] Level calculation (linear or progressive)
- [ ] Level-up animations/notifications
- [ ] XP history log

#### 3.2 Titles & Achievements
- [ ] Display unlocked titles
- [ ] Title progression system
- [ ] Achievement badges
- [ ] Celebration animations

#### 3.3 Statistics & Analytics
- [ ] Completion rates per arc
- [ ] Streak statistics
- [ ] Weekly/monthly/yearly summaries
- [ ] Progress trends

### Phase 4: UI/UX

#### 4.1 Dashboard
- [ ] Overview of all arcs
- [ ] Today's quests summary
- [ ] Recent achievements
- [ ] Quick stats

#### 4.2 Arc Views
- [ ] Individual arc detail page
- [ ] Quest list for arc
- [ ] Tier list for arc
- [ ] Arc progress visualization

#### 4.3 Quest Views
- [ ] Quest detail modal
- [ ] Completion history
- [ ] Streak tracking
- [ ] Edit quest

#### 4.4 Design Elements
- [ ] RPG-style fonts (Orbitron, Cinzel, etc.)
- [ ] Pixel art icons for arcs
- [ ] Character avatar
- [ ] Dark theme with game aesthetics

---

## 🗄️ Database Schema

### Collections Needed:

#### 1. `habits_arcs`
```javascript
{
  $id: string,
  name: string,              // "Mental", "Physical", "Finance"
  color: string,             // Hex color
  icon: string,              // Icon name/URL
  description: string,       // Optional
  householdId: string,       // Shared within household
  createdBy: string,         // User ID
  $createdAt: timestamp,
  $updatedAt: timestamp
}
```

#### 2. `habits_quests`
```javascript
{
  $id: string,
  name: string,              // "Meditate 1x per day"
  arcId: string,            // Reference to arc
  frequency: string,        // "daily", "weekly", "monthly", "annual", "unique"
  repetitionPerPeriod: number, // e.g., 3 (times per week)
  intensity: number,        // 1-5 difficulty scale
  xpPerCompletion: number,  // XP reward
  accessLevel: number,      // Optional
  householdId: string,
  createdBy: string,
  $createdAt: timestamp,
  $updatedAt: timestamp
}
```

#### 3. `habits_quests_completions`
```javascript
{
  $id: string,
  questId: string,
  userId: string,
  completedAt: timestamp,
  streakCount: number,      // Current streak
  householdId: string,
  $createdAt: timestamp
}
```

#### 4. `habits_tiers`
```javascript
{
  $id: string,
  name: string,             // "100 days of meditation"
  arcId: string,
  targetValue: number,      // e.g., 100
  targetType: string,       // "days", "count", "amount"
  xpReward: number,
  titleReward: string,      // Optional class title
  householdId: string,
  createdBy: string,
  $createdAt: timestamp,
  $updatedAt: timestamp
}
```

#### 5. `habits_tiers_completions`
```javascript
{
  $id: string,
  tierId: string,
  userId: string,
  completedAt: timestamp,
  householdId: string,
  $createdAt: timestamp
}
```

#### 6. `habits_user_progress`
```javascript
{
  $id: string,
  userId: string,
  householdId: string,
  totalXP: number,
  globalLevel: number,
  progressionType: string,  // "linear" or "progressive"
  penaltySystemActive: boolean,
  gameDurationYears: number,
  classId: string,         // Selected character class
  unlockedTitles: string[], // Array of title IDs
  arcProgress: {           // Per-arc progress
    [arcId]: {
      totalXP: number,
      level: number,
      questsCompleted: number,
      tiersCompleted: number
    }
  },
  $createdAt: timestamp,
  $updatedAt: timestamp
}
```

#### 7. `habits_classes` (Optional - could be hardcoded)
```javascript
{
  $id: string,
  name: string,            // "MARCHAND", "GUERRIER", etc.
  description: string,
  icon: string,
  characteristics: string[]
}
```

#### 8. `habits_titles` (Optional - could be hardcoded)
```javascript
{
  $id: string,
  name: string,
  tierRequirement: number, // Number of tiers needed
  classId: string,        // Class-specific title
  description: string
}
```

---

## 🎨 UI/UX Design Considerations

### Design Style:
- **RPG/Fantasy Theme**: Use fonts like Orbitron (tech), Cinzel (medieval), or minimalist fonts
- **Dark Theme**: Match existing app dark theme
- **Pixel Art Icons**: For arcs and visual elements
- **Progress Bars**: XP bars, level indicators
- **Card-based Layout**: Similar to expenses/shopping list

### Key Screens:

1. **Habits Dashboard**
   - Arc cards with progress
   - Today's quests summary
   - Recent achievements
   - Global level display

2. **Arc Detail Page**
   - Arc info and progress
   - Quest list (with checkboxes)
   - Tier list
   - Statistics

3. **Quest Management**
   - Add/Edit quest modal
   - Quest detail view
   - Completion history
   - Streak tracking

4. **Tier Management**
   - Add/Edit tier modal
   - Tier progress tracking
   - Achievement celebration

5. **Profile/Character**
   - Class selection
   - Titles display
   - Statistics overview
   - Settings (progression type, penalty system)

---

## 🔧 Implementation Steps

### Step 1: Database Setup
- [ ] Create Appwrite collections
- [ ] Set up indexes
- [ ] Configure permissions

### Step 2: Core Components
- [ ] `HabitsDashboard` component
- [ ] `ArcCard` component
- [ ] `QuestCard` component
- [ ] `TierCard` component
- [ ] `XPBar` component
- [ ] `LevelDisplay` component

### Step 3: Management Modals
- [ ] `AddEditQuestModal`
- [ ] `AddEditTierModal`
- [ ] `AddEditArcModal`
- [ ] `ClassSelectionModal`

### Step 4: Tracking Logic
- [ ] Quest completion logic
- [ ] Streak calculation
- [ ] XP calculation
- [ ] Level calculation
- [ ] Tier progress tracking

### Step 5: Statistics & Analytics
- [ ] Progress charts
- [ ] Completion statistics
- [ ] Streak visualization
- [ ] Historical data

---

## 📝 Notes

- **Household Sharing**: Like other features, habits can be shared within a household
- **Individual Progress**: Each user has their own progress, but can see household members' progress
- **Flexibility**: Allow users to customize their game (progression type, penalty system)
- **Motivation**: Focus on visual feedback, celebrations, and progress visualization
- **Performance**: Consider caching and optimization for frequent quest completions

---

## 🚀 Next Steps

1. Review and refine this plan
2. Set up database collections
3. Start with Phase 1 (Core Structure)
4. Build incrementally, testing as we go

