# Auth Screens

## Components
- LoginScreen.tsx — Two-phase login: credentials then restaurant selection

## Props
- LoginScreenProps from @navigation/types

## Store Dependencies
- authSlice: setAuth, selectRestaurant

## Navigation
- From: App entry (initial route is Auth/Login)
- To: ModeSelect (after login + restaurant selection)
- Phase 1: Email/password form -> POST /api/auth/login
- Phase 2: Restaurant picker (if user has multiple restaurants, otherwise auto-select)

## API Calls
- POST /api/auth/login -> { token, user, restaurants[] }

## Applicable Skills
- web-design-guidelines/SKILL.md
- vercel-react-native-skills/SKILL.md

## Session Notes
(empty)
