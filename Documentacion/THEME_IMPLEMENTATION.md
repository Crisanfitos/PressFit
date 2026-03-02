# Theme Implementation Guide

## Overview
This document describes the Light/Dark mode theming system implemented in the PressFit app. The system allows users to toggle between light and dark themes with colors that adapt dynamically throughout the app.

## Theme Structure

### Color Tokens
The theme system uses semantic color tokens defined in `src/theme/colors.js`:

#### Dark Theme (Default)
- **Background**: `#102218` - Dark green-tinted background
- **Surface**: `rgba(24, 24, 27, 0.6)` - Semi-transparent cards
- **Text**: White primary text
- **Text Secondary**: `#a1a1aa` (zinc-400)
- **Primary**: `#13ec6d` - Brand green
- **Status Colors**: Success (green), Warning (yellow), Info (blue), Error (red)

#### Light Theme
- **Background**: `#f9fafb` - Clean light gray
- **Surface**: White cards with subtle borders
- **Text**: `#111827` (gray-900) - Dark text
- **Text Secondary**: `#6b7280` (gray-500)
- **Primary**: `#13ec6d` - Same brand green
- **Status Colors**: Darker variants for better contrast on light backgrounds

## Architecture

### ThemeContext (`src/context/ThemeContext.js`)
- Manages global theme state
- Persists user preference using AsyncStorage
- Provides `useTheme` hook for accessing theme
- Exports: `theme`, `themeMode`, `toggleTheme`, `isLoading`

### Theme Provider
Wraps the entire app in `App.tsx`:
```typescript
<ThemeProvider>
  <AuthProvider>
    <RootNavigator />
  </AuthProvider>
</ThemeProvider>
```

## Usage in Components

### Basic Usage
```javascript
import { useTheme } from '../context/ThemeContext';

const MyComponent = () => {
  const { theme, themeMode, toggleTheme } = useTheme();
  const { colors } = theme;

  // Define styles inside component to access dynamic colors
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    text: {
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
};
```

### Key Points
1. **Import**: Use `useTheme` hook instead of importing colors directly
2. **Hook Usage**: Call `useTheme()` at component top level
3. **Styles**: Define StyleSheet inside component (not outside) to access theme
4. **Semantic Tokens**: Use semantic tokens like `colors.text` instead of hardcoded values

## Refactored Files

### Core Infrastructure
- ✅ `App.tsx` - Wrapped with ThemeProvider
- ✅ `src/theme/colors.js` - Theme definitions with semantic tokens
- ✅ `src/context/ThemeContext.js` - Theme state management
- ✅ `src/navigation/RootNavigator.js` - StatusBar theming

### Screens (All Refactored)
- ✅ `WeeklyPlanScreen.js` - Weekly workout plan
- ✅ `ProfileScreen.js` - Profile with theme toggle
- ✅ `WorkoutScreen.js` - Workout execution
- ✅ `ExerciseDetailScreen.js` - Exercise details
- ✅ `ExerciseLibraryScreen.js` - Exercise library
- ✅ `ProgressScreen.js` - Progress overview
- ✅ `DailyProgressScreen.js` - Daily stats
- ✅ `WeeklyProgressScreen.js` - Weekly stats
- ✅ `MonthlyProgressScreen.js` - Monthly stats
- ✅ `PhysicalProgressScreen.js` - Physical metrics
- ✅ `ExerciseTrackingScreen.js` - Exercise tracking
- ✅ `LoginScreen.js` - Login
- ✅ `SignUpScreen.js` - Sign up

### Components
- ✅ `EditProfileModal.js` - Profile editing modal

### Navigation
- ✅ `MainNavigator.js` - Tab bar styling

## Theme Toggle

The theme toggle is located in the **Profile Screen**:
- Icon changes based on current mode (dark-mode/light-mode icon)
- Switch component with themed colors
- Shows current status ("Activado"/"Desactivado")
- Persists preference automatically

## Color Mapping

### Common Patterns
| Use Case | Token |
|----------|-------|
| Screen background | `colors.background` |
| Card/Panel background | `colors.surface` |
| Primary text | `colors.text` |
| Secondary/hint text | `colors.textSecondary` |
| Borders | `colors.border` |
| Brand color/CTAs | `colors.primary` |
| Light brand tint | `colors.primaryLight` |
| Success states | `colors.statusSuccess` |
| Success backgrounds | `colors.statusSuccessBg` |
| Warning states | `colors.statusWarning` |
| Warning backgrounds | `colors.statusWarningBg` |
| Error states | `colors.statusError` |
| Error backgrounds | `colors.statusErrorBg` |

## Testing

### Manual Verification Steps
1. **Toggle Test**: 
   - Navigate to Profile screen
   - Toggle "Modo Oscuro" switch
   - Verify immediate UI update across all elements

2. **Persistence Test**:
   - Toggle theme
   - Close and reopen app
   - Verify theme preference is remembered

3. **Screen Coverage**:
   - Navigate through all major screens:
     - Weekly Plan (check cards, badges, buttons)
     - Workout (check exercise cards, inputs, status indicators)
     - Progress screens (check charts, stats cards)
     - Profile (check data cards, settings)
   - Verify good contrast and readability in both modes

4. **Component Tests**:
   - Open EditProfileModal (Profile → Edit)
   - Check input fields, buttons, IMC preview

5. **Navigation**:
   - Check tab bar colors
   - Check StatusBar (light/dark content)

## Known Considerations

### StatusBar
- Dark mode: `light-content` (white icons/text)
- Light mode: `dark-content` (dark icons/text)
- Background color matches theme background

### Platform Differences
- Android: StatusBar background color is set
- iOS: StatusBar style adapts automatically to SafeArea

### Performance
- Styles are recreated on theme change (intentional)
- No performance impact observed with ~14 screens
- AsyncStorage operations are async and non-blocking

## Future Enhancements

Potential improvements:
1. System theme detection (auto mode)
2. Theme-aware splash screen
3. Animated theme transitions
4. More granular color tokens for specific use cases
5. High contrast mode option
6. Custom theme colors (user personalization)

## Troubleshooting

### Issue: Colors not updating
- **Solution**: Ensure StyleSheet.create() is inside component, not outside

### Issue: Hook error
- **Solution**: Verify ThemeProvider wraps the component tree in App.tsx

### Issue: Theme not persisting
- **Solution**: Check AsyncStorage permissions and implementation

### Issue: Inconsistent colors
- **Solution**: Use semantic tokens, not hardcoded values

## Migration Guide (For Future Screens)

When creating new screens:

1. Import theme hook:
```javascript
import { useTheme } from '../context/ThemeContext';
```

2. Use hook in component:
```javascript
const MyScreen = () => {
  const { theme } = useTheme();
  const { colors } = theme;
  
  // Your component logic
  
  const styles = StyleSheet.create({
    // Styles using colors
  });
  
  return (/* JSX */);
};
```

3. Use semantic color tokens throughout
4. Test in both light and dark modes

---

**Implementation Date**: November 2025  
**Status**: ✅ Complete  
**Screens Refactored**: 14/14  
**Components Refactored**: 1/1  
**Navigators Updated**: 2/2
