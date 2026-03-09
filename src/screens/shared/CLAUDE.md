# Shared Screens

## Components
- ModeSelectScreen.tsx — Operator selects POS/KDS/Kiosk/Register mode

## Props
- ModeSelectScreenProps from @navigation/types

## Store Dependencies
- useAuthUser() — display operator name (firstName)
- useSelectedRestaurantId() — current restaurant
- useRestaurants() — find restaurant name by ID

## Navigation
- From: Auth/Login (after login + restaurant selection)
- To: Pos, Kds, Kiosk, or Register (operator selection)

## API Calls
- GET /health — backend connectivity status

## Applicable Skills
- web-design-guidelines/SKILL.md
- vercel-react-native-skills/SKILL.md

## Session Notes
(empty)
