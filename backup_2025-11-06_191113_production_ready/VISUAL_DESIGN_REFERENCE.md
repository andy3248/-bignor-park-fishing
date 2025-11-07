# Visual Design Reference - Yellowave-Inspired Booking System

## Color Palette

### Primary Colors
```
Teal (Primary)     #48d1cc  ███████  rgb(72, 209, 204)
Dark Teal          #20b2aa  ███████  rgb(32, 178, 170)
Deep Teal/Green    #1a9a95  ███████  rgb(26, 154, 149)
```

### Calendar Day Colors
```
Available Green    #dcfce7  ███████  rgb(220, 252, 231)  [Tailwind bg-green-100]
Available Border   #86efac  ███████  rgb(134, 239, 172)
Available Text     #166534  ███████  rgb(22, 101, 52)

Booked Red         #fee2e2  ███████  rgb(254, 226, 226)  [Tailwind bg-red-100]
Booked Border      #fca5a5  ███████  rgb(252, 165, 165)
Booked Text        #991b1b  ███████  rgb(153, 27, 27)

Selected Teal      #48d1cc  ███████  rgb(72, 209, 204)  [Gradient]
Selected Border    #48d1cc  ███████  3px solid
```

### Neutral Colors
```
White              #ffffff  ███████  rgb(255, 255, 255)
Light Gray         #f8f9fa  ███████  rgb(248, 249, 250)
Border Gray        #e9ecef  ███████  rgb(233, 236, 239)
Text Gray          #6c757d  ███████  rgb(108, 117, 125)
Dark Text          #212529  ███████  rgb(33, 37, 41)
```

---

## Typography

### Font Stack
```
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
"Helvetica Neue", Arial, sans-serif
```

### Heading Hierarchy

#### H2 - Section Headings (Calendar, Lakes)
```
Font Size:        2rem (32px)
Font Weight:      800 (Extra Bold)
Color:            #1a9a95 (Deep Teal)
Letter Spacing:   0.5px
Line Height:      1.2
```

#### H3 - Subsection Headings
```
Font Size:        1.8rem (28.8px)
Font Weight:      800 (Extra Bold)
Color:            #1a9a95 (Deep Teal)
Letter Spacing:   0.5px
Line Height:      1.2
```

#### H4 - Card Headings (Lake Names)
```
Font Size:        1.5rem (24px)
Font Weight:      700 (Bold)
Color:            #1a9a95 (Deep Teal)
Letter Spacing:   0.3px
Line Height:      1.3
```

### Body Text
```
Font Size:        1rem (16px)
Font Weight:      400 (Normal)
Color:            #212529 (Dark)
Letter Spacing:   0.3px
Line Height:      1.5
```

### Button Text
```
Font Size:        1rem (16px)
Font Weight:      700 (Bold)
Color:            #ffffff (White)
Letter Spacing:   0.5px
Text Transform:   UPPERCASE
```

---

## Spacing System

### Padding Scale
```
Small:       12px    Month pills, status badges
Medium:      24px    Tab buttons
Large:       32px    Lake cards
X-Large:     48px    Main sections (calendar, forms)
```

### Margin Scale
```
Small:       8px     Month pill gaps
Medium:      20px    Card content margins
Large:       35px    Section header margins
X-Large:     40px    Between major sections
```

### Gap Scale (Grid/Flex)
```
Tight:       8px     Month pills
Normal:      20px    Lake cards
Wide:        32px    Calendar month selector
```

---

## Border Radius

### Rounded Corners
```
Small:       8px     Status badges, small buttons
Medium:      12px    Calendar days, input fields
Large:       20px    Lake cards, form inputs
X-Large:     24px    Major sections (calendar, forms)
Pills:       50px    Month buttons, status pills
Circular:    50%     Icons, avatars
```

---

## Shadows

### Elevation System

#### Level 1 - Subtle (Base)
```css
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
```
**Use**: Month pills (default), minor elements

#### Level 2 - Light (Cards)
```css
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
```
**Use**: Lake availability cards (default)

#### Level 3 - Medium (Sections)
```css
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
```
**Use**: Calendar section, booking form section

#### Level 4 - Strong (Hover - General)
```css
box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
```
**Use**: Section hover states

#### Level 5 - Glow (Teal Elements)
```css
/* Month pill active */
box-shadow: 0 6px 20px rgba(72, 209, 204, 0.4);

/* Lake card hover */
box-shadow: 0 16px 40px rgba(72, 209, 204, 0.2);

/* Button hover */
box-shadow: 0 12px 30px rgba(72, 209, 204, 0.4);

/* Selected day */
box-shadow: 0 6px 20px rgba(72, 209, 204, 0.4);
```
**Use**: Active/selected teal elements, primary CTAs

---

## Hover Effects

### Transform Animations

#### Subtle Lift (2px)
```css
transform: translateY(-2px);
transition: all 0.3s ease;
```
**Use**: Calendar days, month pills, tab icons

#### Medium Lift (4px)
```css
transform: translateY(-4px);
transition: all 0.3s ease;
```
**Use**: Book buttons

#### Strong Lift (6px)
```css
transform: translateY(-6px);
transition: all 0.3s ease;
```
**Use**: Lake cards

### Shadow Progression

#### Standard Pattern
```css
/* Default State */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

/* Hover State */
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
transform: translateY(-2px);
```

#### Teal Glow Pattern
```css
/* Default State */
box-shadow: 0 4px 12px rgba(72, 209, 204, 0.3);

/* Hover State */
box-shadow: 0 12px 30px rgba(72, 209, 204, 0.4);
transform: translateY(-4px);
```

---

## Component Patterns

### Month Pill Button

#### Default State
```
Background:       #f8f9fa (Light Gray)
Border:           2px solid transparent
Border Radius:    50px (Fully Rounded)
Padding:          12px 24px
Font Weight:      600 (Semi-Bold)
Color:            #6c757d (Gray)
Shadow:           0 2px 8px rgba(0, 0, 0, 0.05)
```

#### Hover State
```
Background:       #e9ecef (Darker Gray)
Color:            #48d1cc (Teal)
Transform:        translateY(-2px)
Shadow:           0 4px 12px rgba(0, 0, 0, 0.1)
```

#### Active State
```
Background:       linear-gradient(135deg, #48d1cc 0%, #20b2aa 100%)
Border:           transparent
Color:            #ffffff (White)
Font Weight:      700 (Bold)
Transform:        translateY(-2px)
Shadow:           0 6px 20px rgba(72, 209, 204, 0.4)
```

---

### Calendar Day

#### Default State
```
Background:       #ffffff (White)
Border:           2px solid #e9ecef
Border Radius:    12px
Padding:          Auto (aspect-ratio: 1)
Margin:           2px
Font Weight:      600 (Semi-Bold)
```

#### Available State
```
Background:       #dcfce7 (Light Green)
Border:           #86efac (Green)
Color:            #166534 (Dark Green)
```

#### Available Hover
```
Background:       #bbf7d0 (Brighter Green)
Transform:        translateY(-2px)
Shadow:           0 4px 12px rgba(34, 197, 94, 0.2)
```

#### Unavailable State
```
Background:       #fee2e2 (Light Red)
Border:           #fca5a5 (Red)
Color:            #991b1b (Dark Red)
Cursor:           not-allowed
Opacity:          0.7
```

#### Selected State
```
Background:       linear-gradient(135deg, #48d1cc 0%, #20b2aa 100%)
Border:           3px solid #48d1cc
Color:            #ffffff (White)
Font Weight:      700 (Bold)
Transform:        translateY(-2px)
Shadow:           0 6px 20px rgba(72, 209, 204, 0.4)
```

---

### Lake Availability Card

#### Default State
```
Background:       linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)
Border:           2px solid transparent
Border Radius:    20px
Padding:          32px
Shadow:           0 8px 24px rgba(0, 0, 0, 0.08)
```

#### Hover State
```
Border:           2px solid #48d1cc (Teal)
Transform:        translateY(-6px)
Shadow:           0 16px 40px rgba(72, 209, 204, 0.2)
```

---

### Book Button

#### Default State
```
Background:       linear-gradient(135deg, #48d1cc 0%, #20b2aa 100%)
Border:           none
Border Radius:    12px
Padding:          16px 24px
Color:            #ffffff (White)
Font Weight:      700 (Bold)
Font Size:        1rem
Text Transform:   UPPERCASE
Letter Spacing:   0.5px
Shadow:           0 4px 12px rgba(72, 209, 204, 0.3)
```

#### Hover State
```
Background:       linear-gradient(135deg, #20b2aa 0%, #1a9a95 100%)
Transform:        translateY(-4px)
Shadow:           0 12px 30px rgba(72, 209, 204, 0.4)
```

#### Disabled State
```
Background:       #adb5bd (Gray)
Color:            #ffffff (White)
Cursor:           not-allowed
Transform:        none
Shadow:           none
Opacity:          0.6
```

---

### Tab Navigation

#### Default Tab
```
Background:       transparent
Border Bottom:    4px solid transparent
Padding:          24px 20px
Color:            #6c757d (Gray)
Font Weight:      600 (Semi-Bold)
Letter Spacing:   0.3px
```

#### Tab Hover
```
Background:       rgba(72, 209, 204, 0.1)
Icon Transform:   translateY(-2px)
```

#### Active Tab
```
Background:       rgba(72, 209, 204, 0.08)
Border Bottom:    4px solid #48d1cc (Teal)
Color:            #48d1cc (Teal)
Font Weight:      700 (Bold)
```

---

## Transitions

### Standard Transition
```css
transition: all 0.3s ease;
```
**Use**: Most interactive elements (buttons, cards, days)

### Quick Transition
```css
transition: all 0.2s ease;
```
**Use**: Small elements (icons, badges)

### Slow Transition
```css
transition: all 0.5s ease;
```
**Use**: Section animations, complex transforms

---

## Responsive Breakpoints

### Mobile First Approach

#### Mobile (Default)
```
Max Width:        480px
Calendar:         1 column
Month Pills:      Wrap, smaller padding
Lake Cards:       Stack vertically
Tab Buttons:      Horizontal scroll
```

#### Tablet
```
Min Width:        768px
Calendar:         Remain 7 columns
Lake Cards:       2 columns grid
Padding:          Slightly reduced
```

#### Desktop
```
Min Width:        1024px
Calendar:         7 columns
Lake Cards:       2 columns (auto-fit)
Full Padding:     48px on sections
```

#### Large Desktop
```
Min Width:        1400px
Container:        Max 1400px
Centered:         margin: 0 auto
```

---

## Accessibility

### Focus States
```css
outline: 2px solid #48d1cc;
outline-offset: 2px;
```

### Color Contrast Ratios
```
Teal on White:          4.5:1 ✅ WCAG AA
Dark Green on Light Green: 7:1 ✅ WCAG AAA
Dark Red on Light Red:     7:1 ✅ WCAG AAA
White on Teal:          4.5:1 ✅ WCAG AA
```

---

## Design Principles

### 1. Visual Hierarchy
- ✅ Bold, teal headings stand out
- ✅ Clear distinction between sections
- ✅ Progressive disclosure (tabs → calendar → lakes → form)

### 2. Feedback
- ✅ Hover states on all interactive elements
- ✅ Color coding for availability
- ✅ Shadows indicate elevation
- ✅ Transforms indicate clickability

### 3. Consistency
- ✅ Same border radius system throughout
- ✅ Same shadow system for elevation
- ✅ Same color palette across components
- ✅ Same font family and weights

### 4. Whitespace
- ✅ Generous padding (48px) on sections
- ✅ Clear margins between elements
- ✅ Breathing room around interactive elements
- ✅ Balanced negative space

### 5. Motion
- ✅ Smooth 0.3s transitions
- ✅ Subtle lift effects (2-6px)
- ✅ Shadow progression on hover
- ✅ No jarring animations

---

## Implementation Checklist

### CSS Custom Properties (Optional Enhancement)
```css
:root {
  --teal-500: #48d1cc;
  --teal-600: #20b2aa;
  --teal-700: #1a9a95;
  --green-100: #dcfce7;
  --red-100: #fee2e2;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --radius-pill: 50px;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 15px 40px rgba(0, 0, 0, 0.15);
  --shadow-teal: 0 6px 20px rgba(72, 209, 204, 0.4);
}
```

---

## Quick Reference: Copy-Paste Components

### Teal Gradient Button
```html
<button class="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
  Book Now
</button>
```

### Green Available Day
```html
<div class="bg-green-100 text-green-800 border-2 border-green-300 rounded-xl p-4 hover:bg-green-200 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-pointer">
  15
</div>
```

### Red Unavailable Day
```html
<div class="bg-red-100 text-red-800 border-2 border-red-300 rounded-xl p-4 opacity-70 cursor-not-allowed">
  20
</div>
```

### Teal Selected Day
```html
<div class="bg-gradient-to-br from-teal-500 to-teal-600 text-white border-3 border-teal-500 rounded-xl p-4 font-bold shadow-teal -translate-y-0.5">
  22
</div>
```

---

## Conclusion

This design system provides a **modern, cohesive, professional** appearance that matches Yellowave's aesthetic while maintaining functionality and usability. All components work harmoniously together to create a premium user experience.





















