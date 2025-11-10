# Yellowave Calendar - Visual Style Guide

## Color Palette

### Calendar Days
```
Available Days:    #4ade80 (Green)
                   #22c55e (Hover)
                   
Unavailable Days:  #ef4444 (Red, 60% opacity)

Selected Day:      #48d1cc (Teal)
                   + white dot indicator at bottom

Today:             Teal border ring (#48d1cc)

Other Month:       #d1d5db (Light gray, transparent)
```

### Month Selector
```
Active Month:      #fbbf24 (Yellow/Orange)
                   Shadow: rgba(251, 191, 36, 0.3)

Inactive Months:   White background
                   Border: #d1d5db (Gray)

Hover:             Border: #48d1cc (Teal)
                   Background: #f0fdfc (Light teal)
```

### Navigation Arrows
```
Default:           White background
                   Border: #e9ecef
                   Color: #6c757d

Hover:             Background: #48d1cc
                   Border: #48d1cc
                   Color: White
                   Transform: scale(1.1)
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  CALENDAR SECTION                                       │
├─────────────────────────────────────────────────────────┤
│  [1] Select Date    BIGNOR PARK CARP FISHERY          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [◄] Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec [►]│
│      └─────────────────┘                               │
│      Active month (yellow)                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun                    │
├─────────────────────────────────────────────────────────┤
│  [ ]  [ 1] [ 2] [ 3] [ 4] [ 5] [ 6]                   │
│  [ 7] [ 8] [ 9] [10] [11] [12] [13]                   │
│  [14] [15] [16] [17] [18] [19] [20]                   │
│  [21] [22] [23] [24] [25] [26] [27]                   │
│  [28] [29] [30] [31] [ ]  [ ]  [ ]                    │
│   │                  │                                  │
│   Green=Available   Teal=Selected                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  ● Available    ● Unavailable                          │
└─────────────────────────────────────────────────────────┘
```

## Component Spacing

### Month Pills
- Gap between pills: 8px
- Padding: 10px 20px
- Border radius: 50px (fully rounded)
- Min width: 65px
- Font: 0.9rem, 600 weight

### Navigation Arrows
- Size: 40px × 40px
- Border radius: 50% (circle)
- Border: 2px solid #e9ecef
- Gap from pills: 12px

### Calendar Grid
- Gap between cells: 8px
- Cell padding: 12px (grid container)
- Cell border radius: 10px
- Font: 0.95rem, 600 weight
- Aspect ratio: 1:1 (square cells)

### Legend
- Gap between items: 24px
- Circle size: 14px
- Top padding: 16px
- Font: 0.9rem, 500 weight

## Interaction States

### Month Pills
1. **Default**: White bg, gray border
2. **Hover**: Teal border, light teal bg, translateY(-1px)
3. **Active**: Yellow bg, no border, shadow, translateY(-1px)

### Calendar Days (Available)
1. **Default**: Green solid fill, white text
2. **Hover**: Darker green, scale(1.08), shadow
3. **Selected**: Teal bg, white dot at bottom, scale(1.05)
4. **Focus**: Teal outline, 2px offset

### Calendar Days (Unavailable)
1. **Default**: Red bg, 60% opacity, white text
2. **Hover**: No transform, cursor: not-allowed
3. **Disabled**: No focus, no interaction

### Arrow Buttons
1. **Default**: White bg, gray border
2. **Hover**: Teal bg, teal border, white icon, scale(1.1)
3. **Focus**: Default outline

## Typography

```
Calendar Header (h2):    2rem, 800 weight, #1a9a95
Step Number:             0.9rem, 600 weight, white
Step Text:               Default, 500 weight, gray

Month Pills:             0.9rem, 600 weight (700 active)
Day Numbers:             0.95rem, 600 weight (700 selected)
Day Headers:             0.9rem, 600 weight

Legend:                  0.9rem, 500 weight, #6b7280
```

## Animations & Transitions

```css
/* All transitions */
transition: all 0.25s ease;  /* Month pills */
transition: all 0.2s ease;   /* Calendar days */
transition: all 0.3s ease;   /* Arrow buttons */

/* Transforms */
transform: translateY(-1px);  /* Pills hover */
transform: scale(1.05);       /* Selected day */
transform: scale(1.08);       /* Available day hover */
transform: scale(1.1);        /* Arrow hover */

/* Scroll behavior */
scroll-behavior: smooth;
scrollbar-width: none;        /* Hide scrollbar */
```

## Responsive Breakpoints

### Mobile (<768px)
```
Month Pills:
  - Min width: 60px
  - Padding: 8px 16px
  - Font: 0.85rem
  - Gap: 6px

Arrow Buttons:
  - Size: 36px × 36px

Calendar:
  - Section padding: 24px
  - Grid gap: 6px
  - Grid padding: 8px
  - Day font: 0.85rem
  - Border radius: 8px
```

## Accessibility Notes

1. **Keyboard Navigation**
   - Tab: Focus between months and days
   - Arrow Keys: Navigate calendar grid
   - Enter/Space: Select date
   - Focus rings visible on all interactive elements

2. **Screen Readers**
   - ARIA labels on all dates
   - Role="button" on calendar days
   - Aria-disabled on unavailable dates
   - Descriptive labels on navigation

3. **Color Contrast**
   - All text meets WCAG AA standards
   - Green/Red distinguishable
   - Focus indicators clearly visible

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Features used:
- CSS Grid
- Flexbox
- CSS transforms
- CSS transitions
- ES6 JavaScript
- Smooth scrolling
- CSS custom properties

















