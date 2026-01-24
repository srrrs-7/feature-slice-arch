---
description: Review UI/UX design following Google's design best practices and Material Design principles
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Review and improve UI/UX design following Google's design best practices, Material Design principles, and project-specific design guidelines. Ensure responsive design, accessibility (WCAG 2.1 AA), proper color usage, typography hierarchy, and smooth animations.

## Prerequisites

Before starting, ensure you have read and understand:
- **Design Guide**: `/workspace/main/.claude/rules/design-guide.md`
- **Project Guidelines**: `/workspace/main/.claude/rules/guideline.md`
- **Coding Standards**: `/workspace/main/.claude/rules/coding-rules.md`

## Phase 0: Load Design Context

**CRITICAL**: Read all design-related files before proceeding with review.

```bash
# Read design rules and guidelines
Read /workspace/main/.claude/rules/design-guide.md
Read /workspace/main/.claude/rules/guideline.md
Read /workspace/main/.claude/rules/coding-rules.md
```

**Parse and internalize:**
- Material Design principles (Material is the Metaphor, Bold/Graphic/Intentional, Motion Provides Meaning)
- Responsive design breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)
- Accessibility requirements (WCAG 2.1 AA)
- Color system (primary, secondary, semantic colors)
- Typography scale (xs to 5xl)
- Spacing system (8px grid)
- Animation guidelines (200-300ms, transform/opacity only)

## Phase 1: Identify Review Target

### 1.1 Parse User Request

From `$ARGUMENTS`, identify what to review:
- **New Feature UI**: Full UI/UX review of a new feature
- **Specific Component**: Review a single component or page
- **Design System**: Review global design patterns
- **Accessibility Audit**: Focus on accessibility issues
- **Responsive Review**: Focus on responsive design
- **Performance Review**: Focus on UI performance

If `$ARGUMENTS` is empty, ask user:
```
What would you like me to review?

1. Specific component/page path
2. Recent UI changes (git diff)
3. Entire feature (e.g., apps/web/src/features/todo-list)
4. Accessibility audit
5. Responsive design check
```

### 1.2 Determine Review Scope

**Full UI/UX Review includes:**
- Responsive design (mobile, tablet, desktop)
- Accessibility (keyboard, screen reader, ARIA, contrast)
- Color usage (semantic colors, contrast ratios)
- Typography (hierarchy, readability)
- Layout (spacing, elevation, grid)
- Components (buttons, inputs, cards, modals)
- Animations (transitions, hover states)
- Error handling & feedback (error messages, loading states, empty states)
- Performance (image optimization, lazy loading)

**Component-Specific Review focuses on:**
- Component implementation
- Props and API design
- Styling and Tailwind usage
- Accessibility
- Responsive behavior

## Phase 2: Code Analysis

### 2.1 Read Component Files

Use Glob to find relevant files:

```bash
# Find all Svelte components in the feature
Glob apps/web/src/features/$FEATURE/**/*.svelte

# Find all component files
Glob apps/web/src/features/$FEATURE/components/**/*.svelte

# Find page files
Glob apps/web/src/features/$FEATURE/pages/**/*.svelte
```

Read each component file using Read tool.

### 2.2 Analyze Design Patterns

For each component, check:

#### Responsive Design
- [ ] Uses mobile-first approach (base styles first, then sm:, md:, lg:)
- [ ] Breakpoints are used correctly
- [ ] Touch targets are minimum 44×44px
- [ ] Grid layouts are responsive (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
- [ ] Font sizes scale appropriately (text-2xl sm:text-3xl lg:text-4xl)
- [ ] Padding/spacing scales with screen size

#### Accessibility
- [ ] Semantic HTML elements (<header>, <nav>, <main>, <article>, <button>)
- [ ] ARIA labels for interactive elements (aria-label, aria-describedby)
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- [ ] Keyboard navigation works (tabindex, focus states)
- [ ] Focus management for modals/dialogs
- [ ] Error messages are announced (aria-live, role="alert")
- [ ] Images have alt text
- [ ] Forms have proper labels (for="id")

#### Color System
- [ ] Uses Tailwind color classes (not hardcoded colors)
- [ ] Primary actions use primary colors (bg-primary-600)
- [ ] Semantic colors for states (success-*, error-*, warning-*)
- [ ] Sufficient contrast ratios
- [ ] Color is not the only indicator (icons + text for errors)

#### Typography
- [ ] Clear hierarchy (text-4xl for H1, text-3xl for H2, etc.)
- [ ] Proper font weights (font-bold for headings, font-normal for body)
- [ ] Readable line heights (leading-relaxed)
- [ ] Appropriate font sizes (minimum text-sm for body text)

#### Layout & Spacing
- [ ] Uses 8px grid system (p-4, p-6, p-8, mb-4, space-y-4)
- [ ] Proper use of elevation/shadows (shadow-md, shadow-lg)
- [ ] Cards have proper structure (rounded-lg, overflow-hidden)
- [ ] Maximum width constraints (max-w-4xl, max-w-screen-2xl)
- [ ] Proper use of flexbox/grid

#### Components
- [ ] Buttons have proper variants (primary, secondary, outline, ghost, danger)
- [ ] Buttons have proper sizes (sm, md, lg) with min-height
- [ ] Inputs have labels and error states
- [ ] Forms have validation feedback
- [ ] Modals have proper focus management
- [ ] Loading states are clear (spinners, skeleton screens)

#### Animations
- [ ] Transitions use transform/opacity (not width/height)
- [ ] Duration is 200-300ms
- [ ] Easing functions are appropriate (quintOut)
- [ ] Hover states are smooth (transition-colors, transition-transform)
- [ ] Page transitions use Svelte transitions (fade, fly, slide, scale)

#### Error Handling & Feedback
- [ ] Error messages are specific and actionable
- [ ] Success feedback is visible (toast, alert)
- [ ] Loading states are clear
- [ ] Empty states have helpful messages
- [ ] Confirmation dialogs for destructive actions

## Phase 3: Review Report

### 3.1 Structure the Report

```markdown
# Design Review Report: [Component/Feature Name]

## 📊 Overall Score: [X/10]

### ✅ Strengths
[List what is well-implemented]
- Proper use of Material Design principles
- Excellent responsive design
- Good accessibility practices

### 🔴 Critical Issues
[Issues that must be fixed immediately]

#### Issue 1: [Title]
- **Location**: `apps/web/src/features/todo-list/components/TaskCard.svelte:42`
- **Problem**: Button touch target is only 30×30px (below 44×44px minimum)
- **Impact**: Mobile users will have difficulty tapping
- **Fix**:
  ```svelte
  <!-- Before -->
  <button class="p-1">Delete</button>

  <!-- After -->
  <button class="min-h-[44px] min-w-[44px] p-2">Delete</button>
  ```
- **Priority**: 🔴 High

### 🟡 Design Issues
[Issues that should be addressed]

#### Issue 1: [Title]
- **Location**: [File:Line]
- **Problem**: [Description]
- **Recommendation**: [How to fix]
- **Priority**: 🟡 Medium

### 🔵 Suggestions
[Nice-to-have improvements]

#### Suggestion 1: [Title]
- **Location**: [File:Line]
- **Suggestion**: [Description]
- **Benefit**: [Why this would improve UX]
- **Priority**: 🔵 Low

### 📋 Checklist Results

#### Responsive Design: [X/Y]
- [x] Mobile-first approach
- [x] Breakpoints used correctly
- [ ] Touch targets ≥44×44px
- [x] Responsive grid
- [x] Scalable typography

#### Accessibility: [X/Y]
- [x] Semantic HTML
- [ ] ARIA labels
- [ ] Color contrast (WCAG AA)
- [x] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader support

#### Color System: [X/Y]
- [x] Tailwind colors
- [x] Semantic colors
- [ ] Contrast ratios
- [ ] Non-color indicators

#### Typography: [X/Y]
- [x] Clear hierarchy
- [x] Proper font weights
- [x] Readable line heights
- [x] Appropriate sizes

#### Layout: [X/Y]
- [x] 8px grid
- [x] Elevation/shadows
- [x] Card structure
- [x] Max-width constraints
- [x] Flexbox/grid

#### Components: [X/Y]
- [ ] Button variants
- [ ] Button sizes
- [x] Input labels
- [x] Form validation
- [ ] Modal focus
- [x] Loading states

#### Animations: [X/Y]
- [x] Transform/opacity
- [x] 200-300ms duration
- [x] Appropriate easing
- [x] Smooth hover states
- [x] Svelte transitions

#### Error Handling: [X/Y]
- [x] Specific error messages
- [x] Success feedback
- [x] Loading states
- [x] Empty states
- [x] Confirmation dialogs

### 📝 Next Steps

1. Fix critical issues (Priority 🔴)
2. Address design issues (Priority 🟡)
3. Consider suggestions (Priority 🔵)
4. Run accessibility audit tools (axe DevTools)
5. Test on real devices (mobile, tablet)

### 🔗 References

- [Design Guide](/workspace/main/.claude/rules/design-guide.md)
- [Material Design](https://m3.material.io/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
```

## Phase 4: Actionable Recommendations

### 4.1 Prioritize Issues

**Critical (Fix Immediately):**
- Accessibility violations (WCAG failures)
- Touch targets below 44×44px
- Contrast ratios below 4.5:1
- Broken keyboard navigation
- Missing ARIA labels on interactive elements

**High (Fix Soon):**
- Missing focus states
- Poor responsive design
- Inconsistent color usage
- Missing error feedback
- Performance issues

**Medium (Should Fix):**
- Typography hierarchy issues
- Spacing inconsistencies
- Missing hover states
- Suboptimal animations

**Low (Nice to Have):**
- Minor styling tweaks
- Additional micro-interactions
- Enhanced empty states

### 4.2 Provide Code Examples

For each issue, provide:
- **Before**: Current implementation
- **After**: Fixed implementation
- **Explanation**: Why the fix improves UX

## Phase 5: Interactive Review (Optional)

### 5.1 Ask User for Priorities

```
I've identified [X] critical issues, [Y] design issues, and [Z] suggestions.

Would you like me to:
1. Fix critical issues automatically
2. Review issues one by one
3. Focus on specific area (accessibility, responsive, etc.)
4. Generate a full report only
```

### 5.2 Apply Fixes (If Requested)

Use Edit tool to apply fixes to component files.

### 5.3 Verify Fixes

After applying fixes:
```bash
# Type check
bun run check:type

# Lint
bun run check:biome

# Start dev server
bun run dev:web
```

## Best Practices

This command enforces:
1. **Material Design Principles** - Follow Google's design system
2. **Mobile-First** - Design for mobile, scale up
3. **Accessibility First** - WCAG 2.1 AA compliance
4. **8px Grid** - Consistent spacing
5. **Semantic Colors** - Meaningful color usage
6. **Typography Hierarchy** - Clear text hierarchy
7. **Smooth Animations** - 200-300ms, transform/opacity
8. **User Feedback** - Clear error/success messages

## References

- `/workspace/main/.claude/rules/design-guide.md`
- `/workspace/main/.claude/rules/guideline.md`
- `/workspace/main/.claude/rules/coding-rules.md`
