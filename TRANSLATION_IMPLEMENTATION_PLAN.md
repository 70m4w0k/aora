# 🌍 Translation System Implementation Plan

## Overview
Implement a simple but effective translation system for Tipi app supporting English and French.

## Architecture

### 1. Translation Files Structure
```
i18n/
├── en.json    # English translations
├── fr.json    # French translations
└── index.js   # Translation utilities and context
```

### 2. Language Context
- Create `context/LanguageProvider.js` to manage language state
- Store language preference in AsyncStorage
- Provide `useLanguage` hook for components

### 3. Translation Hook
- Create `hooks/useTranslation.js` for easy access to translations
- Usage: `const t = useTranslation(); t('home.title')`

### 4. Language Selector
- Add language selector in Profile screen
- Allow switching between English and French
- Persist choice in AsyncStorage

## Implementation Steps

### Step 1: Create Translation Files
- Create `i18n/en.json` with all English strings
- Create `i18n/fr.json` with all French translations
- Organize by screen/feature (auth, home, shopping, expenses, etc.)

### Step 2: Create Language Context
- Create `context/LanguageProvider.js`
- Implement language state management
- Add AsyncStorage persistence
- Detect device language on first launch

### Step 3: Create Translation Hook
- Create `hooks/useTranslation.js`
- Provide easy access to translations
- Handle missing translations gracefully

### Step 4: Update GlobalProvider
- Integrate LanguageProvider into GlobalProvider
- Make language available app-wide

### Step 5: Add Language Selector UI
- Add language selector in Profile screen
- Show current language
- Allow switching languages

### Step 6: Replace Hardcoded Strings
- Replace all hardcoded strings with translation keys
- Start with critical screens (auth, home)
- Then move to other screens

## Translation Keys Organization

```json
{
  "auth": {
    "signIn": {
      "title": "Welcome Back",
      "subtitle": "Sign in to your account to continue",
      "email": "Email",
      "password": "Password",
      "signIn": "Sign In",
      "signingIn": "Signing in...",
      "noAccount": "Don't have an account?",
      "signUp": "Sign Up"
    }
  },
  "home": {
    "greeting": "Hello",
    "quickAccess": "QUICK ACCESS",
    "pending": "Pending",
    "toBuy": "To buy",
    "expenses": "Expenses"
  }
}
```

## Priority Order

1. **Critical Path** (Must translate first):
   - Authentication screens (sign-in, sign-up)
   - Home dashboard
   - Navigation labels

2. **Important Features**:
   - Shopping list
   - Expenses
   - Calendar/Tasks
   - Profile

3. **Secondary Features**:
   - Error messages
   - Success messages
   - Empty states
   - Placeholders

## Testing Checklist

- [ ] Language persists after app restart
- [ ] Language changes immediately when switched
- [ ] All screens display correct language
- [ ] Missing translations show fallback (English)
- [ ] Device language detection works
- [ ] Language selector is accessible

