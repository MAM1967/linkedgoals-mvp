# LinkedGoals Branding & Design System

This directory contains the official branding guidelines and design system for the LinkedGoals application. **All components must reference these variables** to maintain consistent branding throughout the application.

## 🎨 Color Scheme

Our color palette is inspired by LinkedIn's professional design language, featuring trustworthy blues with modern accents.

### Primary Brand Colors

```css
--brand-primary: #0077b5           /* Main LinkedIn Blue */
--brand-primary-dark: #005582      /* Darker variant for hover states */
--brand-primary-light: #1a8ccc     /* Lighter variant for backgrounds */
--brand-primary-pale: #e8f4f8      /* Very light blue for highlights */
```

### Secondary Colors

```css
--brand-secondary: #1976d2         /* Professional accent blue */
--brand-secondary-dark: #1565c0    /* Darker accent */
--brand-secondary-light: #42a5f5   /* Lighter accent */
```

### Status Colors

```css
--color-success: #22c55e           /* Green for positive actions */
--color-warning: #f59e0b           /* Amber for attention needed */
--color-error: #ef4444             /* Red for errors */
--color-info: #3b82f6              /* Blue for information */
```

### Text Colors for Dark Backgrounds

```css
--text-on-dark-primary: #ffffff    /* Pure white for maximum contrast */
--text-on-dark-secondary: #f8fafc  /* Off-white for secondary text */
--text-on-dark-muted: rgba(255, 255, 255, 0.8)  /* Semi-transparent white */
--text-on-dark-subtle: rgba(255, 255, 255, 0.7) /* Subtle white for labels */
```

## 🔧 How to Use

### 1. Import in Your Component CSS

```css
/* Your component CSS file should use existing brand variables */
.my-component {
  background: var(--brand-primary);
  color: white;
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### 2. Use Predefined Gradients

```css
.header-section {
  background: var(--gradient-header); /* Primary brand gradient */
}

.card-background {
  background: var(--gradient-card); /* Subtle card gradient */
}
```

### 3. Typography

```css
.title {
  font-family: var(--font-family-primary);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
```

### 4. Spacing & Layout

```css
.section {
  padding: var(--spacing-8); /* 32px */
  margin-bottom: var(--spacing-6); /* 24px */
  gap: var(--spacing-4); /* 16px */
}
```

### 5. Interactive Elements

```css
.button {
  background: var(--brand-primary);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);
}

.button:hover {
  background: var(--brand-primary-dark);
  box-shadow: var(--shadow-primary);
  transform: translateY(-1px);
}
```

## 📐 Design Tokens Reference

### Spacing Scale

```css
--spacing-1: 0.25rem    /* 4px */
--spacing-2: 0.5rem     /* 8px */
--spacing-4: 1rem       /* 16px */
--spacing-6: 1.5rem     /* 24px */
--spacing-8: 2rem       /* 32px */
--spacing-12: 3rem      /* 48px */
```

### Font Sizes

```css
--font-size-xs: 0.75rem     /* 12px */
--font-size-sm: 0.875rem    /* 14px */
--font-size-base: 1rem      /* 16px */
--font-size-lg: 1.125rem    /* 18px */
--font-size-xl: 1.25rem     /* 20px */
--font-size-2xl: 1.5rem     /* 24px */
--font-size-3xl: 1.875rem   /* 30px */
--font-size-4xl: 2.25rem    /* 36px */
```

### Border Radius

```css
--radius-sm: 0.25rem     /* 4px */
--radius-md: 0.5rem      /* 8px */
--radius-lg: 0.75rem     /* 12px */
--radius-xl: 1rem        /* 16px */
--radius-2xl: 1.5rem     /* 24px */
```

### Shadows

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1)
--shadow-md: 0 10px 15px rgba(0, 0, 0, 0.1)
--shadow-primary: 0 4px 14px rgba(0, 119, 181, 0.25)
```

## ✅ Component Development Guidelines

### DO ✅

- **Always use CSS variables** from `branding.css`
- **Use semantic color names** (`--brand-primary` not `#0077b5`)
- **Leverage predefined gradients** (`--gradient-header`)
- **Use consistent spacing** (`--spacing-4` not `1rem`)
- **Follow the typography scale** (`--font-size-xl`)
- **Use branded shadows** (`--shadow-primary` for important elements)

### DON'T ❌

- **Never hardcode colors** (`color: #0077b5` ❌)
- **Don't create custom gradients** without adding them to `branding.css`
- **Avoid inconsistent spacing** (`padding: 15px` ❌)
- **Don't ignore the typography scale** (`font-size: 1.3rem` ❌)
- **Never use arbitrary shadow values** (`box-shadow: 0 2px 8px #ccc` ❌)

## 🎯 Brand Consistency Checklist

When creating a new component, ensure:

- [ ] Uses `--brand-primary` or `--brand-secondary` for main actions
- [ ] Uses predefined gradients (`--gradient-header`, `--gradient-card`)
- [ ] Follows spacing scale (`--spacing-*`)
- [ ] Uses typography tokens (`--font-size-*`, `--font-weight-*`)
- [ ] Implements proper hover states with branded colors
- [ ] Uses consistent border radius (`--radius-*`)
- [ ] Applies appropriate shadows (`--shadow-*`)
- [ ] Follows transition timing (`--transition-normal`)

## 🔄 Updates & Maintenance

When updating colors or design tokens:

1. **Update `branding.css`** - the single source of truth
2. **Test across all components** - ensure no breaking changes
3. **Update this README** - if new tokens are added
4. **Document breaking changes** - in component migration guides

---

**Remember: This branding system ensures a professional, cohesive user experience that builds trust and reinforces the LinkedGoals brand identity.**
