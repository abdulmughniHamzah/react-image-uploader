# 🎨 Styling Guide - React Blob Uploader

**Version:** 2.0.0  
**Styling System:** Tailwind CSS (fully customizable)

---

## 🎯 **OVERVIEW**

The `react-blob-uploader` component uses **100% Tailwind CSS** with **NO custom CSS variables**. This makes it:
- ✅ **Theme-agnostic** - Works with any design system
- ✅ **Fully customizable** - Every element can be styled
- ✅ **Zero conflicts** - No CSS variable clashes
- ✅ **Framework compatible** - Works with any Tailwind setup

---

## 📦 **ALL STYLEABLE ELEMENTS**

The component exposes **14 styling props** for complete customization:

```typescript
interface StylingProps {
  containerClassName?: string;              // Main container
  uploadButtonClassName?: string;           // Upload button
  blobContainerClassName?: string;          // Individual blob container
  blobImageClassName?: string;              // Blob image
  blobContainerFailedClassName?: string;    // Failed state container
  blobImageFailedClassName?: string;        // Failed state image
  removeButtonClassName?: string;           // Remove (X) button
  removeButtonIconClassName?: string;       // Remove button icon
  mainBlobBadgeClassName?: string;          // "Main" badge
  setMainButtonClassName?: string;          // "Set Main" button
  loadingContainerClassName?: string;       // Loading overlay
  loadingSpinnerClassName?: string;         // Loading spinner icon
  errorContainerClassName?: string;         // Error message container
  errorMessageClassName?: string;           // Error message text
  retryButtonClassName?: string;            // Retry button
}
```

---

## 🎨 **DEFAULT STYLES**

### **1. Container**
```typescript
containerClassName: `
  flex flex-wrap justify-start items-stretch
  gap-x-2 gap-y-4 lg:gap-x-4 lg:gap-y-6
  w-full
`
```

### **2. Upload Button**
```typescript
uploadButtonClassName: `
  w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] 
  md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
  flex items-center justify-center
  text-sm font-medium text-gray-600
  border-2 border-dashed border-gray-300
  rounded-lg
  bg-gray-50 hover:bg-gray-100
  hover:text-gray-800 hover:border-gray-400
  cursor-pointer
  transition-all duration-200
`
```

### **3. Blob Container (Normal)**
```typescript
blobContainerClassName: `
  relative
  w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] 
  md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]
  rounded-lg overflow-hidden
  bg-white border border-gray-200
  shadow-sm
`
```

### **4. Blob Container (Failed State)**
```typescript
blobContainerFailedClassName: `
  ring-2 ring-red-500
`
```

### **5. Remove Button**
```typescript
removeButtonClassName: `
  absolute top-1 right-1
  w-6 h-6
  flex items-center justify-center
  rounded-full
  bg-red-500 hover:bg-red-600
  text-white cursor-pointer
  transition-colors duration-200
  shadow-md z-10
`
```

### **6. Main Badge**
```typescript
mainBlobBadgeClassName: `
  absolute bottom-1 left-1
  px-2 py-0.5
  text-xs font-semibold
  bg-blue-600 text-white
  rounded shadow-sm z-10
`
```

### **7. Set Main Button**
```typescript
setMainButtonClassName: `
  absolute bottom-1 left-1
  px-2 py-0.5
  text-xs font-medium
  bg-white bg-opacity-90 hover:bg-opacity-100
  text-gray-700 hover:text-gray-900
  rounded cursor-pointer
  transition-all duration-200
  shadow-sm z-10
`
```

### **8. Loading Overlay**
```typescript
loadingContainerClassName: `
  absolute inset-0
  flex items-center justify-center
  bg-black bg-opacity-40
  backdrop-blur-sm z-20
`

loadingSpinnerClassName: `
  text-white animate-spin w-8 h-8
`
```

### **9. Error Display**
```typescript
errorContainerClassName: `
  absolute bottom-0 left-0 right-0
  px-2 py-2
  bg-red-600
  flex flex-col items-start gap-1
  z-10
`

errorMessageClassName: `
  text-xs text-white leading-tight
`
```

### **10. Retry Button**
```typescript
retryButtonClassName: `
  px-2 py-1
  text-xs font-medium
  bg-white text-red-600
  hover:bg-red-50
  rounded
  transition-colors duration-200
  cursor-pointer
`
```

---

## 🔧 **CUSTOMIZATION EXAMPLES**

### **Example 1: Match Your Theme Colors**

```tsx
import ImageUploader from 'react-blob-uploader';

const customStyling = {
  uploadButtonClassName: `
    w-32 h-32
    flex items-center justify-center
    border-2 border-dashed border-primary
    bg-background hover:bg-accent
    text-foreground
    rounded-lg cursor-pointer
  `,
  
  blobContainerClassName: `
    relative w-32 h-32
    rounded-lg overflow-hidden
    bg-card border border-border
  `,
  
  removeButtonClassName: `
    absolute top-2 right-2
    w-6 h-6
    bg-destructive hover:bg-destructive/90
    text-destructive-foreground
    rounded-full
  `,
  
  mainBlobBadgeClassName: `
    absolute bottom-2 left-2
    px-2 py-1
    bg-primary text-primary-foreground
    text-xs font-semibold
    rounded
  `,
};

function MyComponent() {
  return (
    <ImageUploader
      {...props}
      styling={customStyling}
    />
  );
}
```

### **Example 2: Dark Mode**

```tsx
const darkModeStyling = {
  uploadButtonClassName: `
    w-32 h-32
    border-2 border-dashed border-gray-600
    bg-gray-800 hover:bg-gray-700
    text-gray-300 hover:text-white
    rounded-lg cursor-pointer
  `,
  
  blobContainerClassName: `
    relative w-32 h-32
    bg-gray-800 border border-gray-700
    rounded-lg overflow-hidden
  `,
  
  mainBlobBadgeClassName: `
    absolute bottom-2 left-2
    px-2 py-1
    bg-blue-500 text-white
    text-xs font-semibold
    rounded
  `,
  
  errorContainerClassName: `
    absolute bottom-0 left-0 right-0
    px-2 py-2
    bg-red-900 bg-opacity-90
    flex flex-col gap-1
  `,
};
```

### **Example 3: Custom Brand Colors**

```tsx
const brandStyling = {
  uploadButtonClassName: `
    w-32 h-32
    border-2 border-dashed border-purple-300
    bg-purple-50 hover:bg-purple-100
    text-purple-600 hover:text-purple-700
    rounded-lg
  `,
  
  mainBlobBadgeClassName: `
    absolute bottom-2 left-2
    px-2 py-1
    bg-gradient-to-r from-purple-600 to-pink-600
    text-white text-xs font-semibold
    rounded-full
  `,
  
  retryButtonClassName: `
    px-3 py-1
    bg-purple-600 text-white
    hover:bg-purple-700
    rounded-md
    text-xs font-medium
  `,
};
```

### **Example 4: Minimal Style**

```tsx
const minimalStyling = {
  uploadButtonClassName: `
    w-24 h-24
    border border-gray-300
    bg-transparent hover:bg-gray-50
    text-gray-500
    rounded
  `,
  
  blobContainerClassName: `
    relative w-24 h-24
    rounded overflow-hidden
    border border-gray-200
  `,
  
  removeButtonClassName: `
    absolute top-1 right-1
    w-5 h-5
    bg-black bg-opacity-50 hover:bg-opacity-70
    text-white
    rounded-full
  `,
  
  mainBlobBadgeClassName: `
    absolute top-1 left-1
    px-1 py-0.5
    bg-black bg-opacity-60
    text-white text-[10px]
    rounded
  `,
};
```

---

## 🎨 **THEMING WITH CSS VARIABLES**

You can also use Tailwind's CSS variable support:

```tsx
// In your Tailwind config
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        // ... more colors
      },
    },
  },
};

// Then use in styling
const themedStyling = {
  uploadButtonClassName: `
    w-32 h-32
    border-2 border-dashed border-primary
    bg-secondary hover:bg-primary/10
    text-primary
    rounded-lg
  `,
  
  mainBlobBadgeClassName: `
    absolute bottom-2 left-2
    px-2 py-1
    bg-primary text-white
    rounded
  `,
};
```

---

## 🔄 **RESPONSIVE DESIGN**

All default styles include responsive breakpoints:

```typescript
// Default sizes
w-[80px] h-[80px]        // Mobile
sm:w-[100px] sm:h-[100px]  // Small screens
md:w-[120px] md:h-[120px]  // Medium screens
lg:w-[140px] lg:h-[140px]  // Large screens
```

**Customize for your breakpoints:**

```tsx
const customSizes = {
  uploadButtonClassName: `
    w-20 h-20           // Smaller mobile
    md:w-32 md:h-32     // Medium
    xl:w-40 xl:h-40     // Extra large
    border-2 border-dashed border-gray-300
    bg-gray-50
    rounded-lg
  `,
  
  blobContainerClassName: `
    w-20 h-20
    md:w-32 md:h-32
    xl:w-40 xl:h-40
    rounded-lg overflow-hidden
    border border-gray-200
  `,
};
```

---

## 🎯 **ELEMENT-BY-ELEMENT GUIDE**

### **Upload Button**
**What:** The "+" button to add new files  
**Classes:** `uploadButtonClassName`  
**Default:** Gray dashed border, hover effects  
**Customize:** Colors, size, border style

### **Blob Container**
**What:** Container for each uploaded blob  
**Classes:** `blobContainerClassName` (normal), `blobContainerFailedClassName` (failed)  
**Default:** White background, gray border, shadow  
**Customize:** Size, colors, border, shadow

### **Blob Image**
**What:** The actual image/file preview  
**Classes:** `blobImageClassName` (normal), `blobImageFailedClassName` (failed)  
**Default:** Full cover, dimmed on failure  
**Customize:** Object-fit, opacity, filters

### **Remove Button**
**What:** X button to remove blob  
**Classes:** `removeButtonClassName`, `removeButtonIconClassName`  
**Default:** Red circular button, top-right  
**Customize:** Position, size, colors, shape

### **Main Badge**
**What:** "Main" badge on featured blob  
**Classes:** `mainBlobBadgeClassName`  
**Default:** Blue background, bottom-left  
**Customize:** Colors, position, size, text

### **Set Main Button**
**What:** Button to mark blob as main  
**Classes:** `setMainButtonClassName`  
**Default:** White semi-transparent, bottom-left  
**Customize:** Colors, position, opacity

### **Loading Overlay**
**What:** Spinner shown during upload  
**Classes:** `loadingContainerClassName`, `loadingSpinnerClassName`  
**Default:** Black overlay with blur, white spinner  
**Customize:** Overlay color/opacity, spinner color/size

### **Error Display**
**What:** Error message at bottom of blob  
**Classes:** `errorContainerClassName`, `errorMessageClassName`  
**Default:** Red background, white text  
**Customize:** Colors, position, padding

### **Retry Button**
**What:** Button shown on failed states  
**Classes:** `retryButtonClassName`  
**Default:** White button with red text  
**Customize:** Colors, size, position

---

## 💡 **USAGE**

### **Basic Override:**

```tsx
import ImageUploader, { StylingProps } from 'react-blob-uploader';

const customStyles: StylingProps = {
  // Override only what you need
  uploadButtonClassName: 'w-32 h-32 border-blue-500 bg-blue-50',
  mainBlobBadgeClassName: 'bg-purple-600 text-white px-3 py-1',
};

<ImageUploader
  {...props}
  styling={customStyles}
/>
```

### **Complete Override:**

```tsx
import ImageUploader from 'react-blob-uploader';

// Match your entire design system
const appStyling = {
  containerClassName: 'grid grid-cols-4 gap-4',
  
  uploadButtonClassName: `
    aspect-square
    border-2 border-dashed border-brand-primary
    bg-brand-light hover:bg-brand-lighter
    text-brand-dark
    rounded-2xl
  `,
  
  blobContainerClassName: `
    aspect-square
    bg-surface border border-outline
    rounded-2xl overflow-hidden
    shadow-elevation-1
  `,
  
  removeButtonClassName: `
    absolute top-2 right-2
    w-7 h-7
    bg-error hover:bg-error-dark
    text-on-error
    rounded-full shadow-md
  `,
  
  mainBlobBadgeClassName: `
    absolute top-2 left-2
    px-3 py-1
    bg-primary text-on-primary
    text-xs font-bold uppercase
    rounded-full
  `,
  
  // ... all other elements
};

<ImageUploader styling={appStyling} {...props} />
```

---

## 🎭 **THEMING STRATEGIES**

### **Strategy 1: CSS Variables**
```tsx
// Define in your app
:root {
  --uploader-primary: #3b82f6;
  --uploader-error: #ef4444;
}

// Use in styling
const styling = {
  uploadButtonClassName: 'border-[var(--uploader-primary)] bg-blue-50',
  errorContainerClassName: 'bg-[var(--uploader-error)]',
};
```

### **Strategy 2: Tailwind Theme Extension**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        uploader: {
          primary: '#3b82f6',
          error: '#ef4444',
        },
      },
    },
  },
};

// Use in component
const styling = {
  uploadButtonClassName: 'border-uploader-primary bg-blue-50',
  errorContainerClassName: 'bg-uploader-error',
};
```

### **Strategy 3: Dynamic Classes**
```tsx
// Build classes programmatically
function getUploaderStyling(theme: 'light' | 'dark') {
  return {
    uploadButtonClassName: theme === 'dark'
      ? 'border-gray-600 bg-gray-800 text-gray-300'
      : 'border-gray-300 bg-gray-50 text-gray-600',
      
    blobContainerClassName: theme === 'dark'
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-gray-200',
  };
}

<ImageUploader styling={getUploaderStyling('dark')} />
```

---

## 🖼️ **VISUAL STATES**

### **Normal State:**
- Container: White background, gray border
- Image: Full opacity
- Buttons: Visible on hover/present

### **Loading State:**
- Overlay: Black semi-transparent with blur
- Spinner: White, animated
- Other elements: Dimmed

### **Failed State:**
- Container: Red ring border
- Image: 50% opacity (dimmed)
- Error: Red background at bottom
- Retry button: White button with red text

### **Main Blob:**
- Badge: Blue badge saying "Main"
- Other blobs: Show "Set Main" button

---

## 📱 **RESPONSIVE EXAMPLES**

### **Mobile-First Approach:**

```tsx
const responsiveStyling = {
  uploadButtonClassName: `
    w-16 h-16              // Mobile
    md:w-24 md:h-24        // Tablet
    lg:w-32 lg:h-32        // Desktop
    border-2 border-dashed
    bg-gray-50
    rounded-lg
  `,
  
  containerClassName: `
    grid
    grid-cols-3            // Mobile: 3 columns
    md:grid-cols-4         // Tablet: 4 columns
    lg:grid-cols-5         // Desktop: 5 columns
    gap-2 md:gap-4
  `,
};
```

---

## 🎨 **POPULAR DESIGN SYSTEMS**

### **Material Design:**
```tsx
const materialStyling = {
  uploadButtonClassName: `
    w-32 h-32
    border border-gray-300
    bg-transparent hover:bg-gray-100
    text-gray-700
    rounded-md
    elevation-1
  `,
  
  blobContainerClassName: `
    relative w-32 h-32
    rounded-md overflow-hidden
    elevation-2
  `,
  
  removeButtonClassName: `
    absolute top-2 right-2
    w-6 h-6
    bg-red-500 hover:bg-red-600
    rounded-full
    elevation-3
  `,
};
```

### **Shadcn/UI:**
```tsx
const shadcnStyling = {
  uploadButtonClassName: `
    w-32 h-32
    border-2 border-dashed
    border-input
    bg-background hover:bg-accent
    text-muted-foreground hover:text-accent-foreground
    rounded-lg
  `,
  
  blobContainerClassName: `
    relative w-32 h-32
    bg-card
    border border-border
    rounded-lg overflow-hidden
  `,
  
  mainBlobBadgeClassName: `
    absolute bottom-2 left-2
    px-2 py-1
    bg-primary text-primary-foreground
    text-xs font-semibold
    rounded-md
  `,
  
  retryButtonClassName: `
    px-2 py-1
    bg-destructive text-destructive-foreground
    hover:bg-destructive/90
    rounded-md text-xs
  `,
};
```

### **DaisyUI:**
```tsx
const daisyuiStyling = {
  uploadButtonClassName: 'btn btn-outline btn-primary w-32 h-32',
  removeButtonClassName: 'btn btn-circle btn-error btn-sm absolute top-1 right-1',
  mainBlobBadgeClassName: 'badge badge-primary absolute bottom-2 left-2',
  retryButtonClassName: 'btn btn-error btn-xs',
};
```

---

## 🔄 **DYNAMIC THEMING**

### **With Theme Provider:**

```tsx
import { useTheme } from '@/context/ThemeContext';

function MyForm() {
  const { theme } = useTheme();
  
  const styling = useMemo(() => ({
    uploadButtonClassName: `
      w-32 h-32
      border-2 border-dashed
      ${theme.colors.border}
      ${theme.colors.background}
      ${theme.colors.text}
      rounded-lg
    `,
    
    mainBlobBadgeClassName: `
      absolute bottom-2 left-2
      px-2 py-1
      ${theme.colors.primary}
      text-white text-xs
      rounded
    `,
  }), [theme]);
  
  return <ImageUploader styling={styling} {...props} />;
}
```

---

## 🎯 **BEST PRACTICES**

### **1. Override Only What You Need**
```tsx
// ✅ Good - minimal overrides
const styling = {
  mainBlobBadgeClassName: 'bg-purple-600',  // Just change color
};

// ❌ Unnecessary - too many overrides
const styling = {
  mainBlobBadgeClassName: 'absolute bottom-1 left-1 px-2 py-0.5 text-xs bg-purple-600 text-white rounded z-10',
};
```

### **2. Use Tailwind's Utilities**
```tsx
// ✅ Good - Tailwind utilities
className: 'bg-blue-600 hover:bg-blue-700 transition-colors'

// ❌ Avoid - inline styles
style={{backgroundColor: '#3b82f6'}}
```

### **3. Maintain Positioning**
```tsx
// ✅ Good - keeps functionality
removeButtonClassName: 'absolute top-2 right-2 ...'  // Still positioned

// ❌ Bad - breaks layout
removeButtonClassName: 'bg-red-500 ...'  // Lost positioning
```

### **4. Test Responsive Breakpoints**
```tsx
// ✅ Good - responsive
className: 'w-20 md:w-24 lg:w-32'

// ⚠️ Consider - fixed size might not work on all screens
className: 'w-32 h-32'
```

---

## 📊 **STYLE PRIORITY**

The component merges styling like this:

```typescript
// 1. Default styles (from library)
// 2. Custom styles (from your prop)
// 3. Conditional styles (failed state, etc.)

// Example:
<div className={`
  ${styling.blobContainerClassName}           // Your custom or default
  ${isInFailedState ? styling.blobContainerFailedClassName : ''}  // Conditional
`}>
```

---

## ✨ **TIPS**

### **Debugging Styles:**
```tsx
// Log the merged styling
console.log(styling);

// Inspect in browser DevTools
// All classes are visible in the DOM
```

### **Testing Overrides:**
```tsx
// Start with one element
const testStyling = {
  uploadButtonClassName: 'bg-red-500',  // Easy to spot
};
```

### **Maintaining Consistency:**
```tsx
// Create a styling module
// src/styles/uploaderStyling.ts
export const uploaderStyling = {
  uploadButtonClassName: '...',
  // ... all styles
};

// Import and use
import { uploaderStyling } from './styles/uploaderStyling';
<ImageUploader styling={uploaderStyling} />
```

---

## 🚀 **PRODUCTION READY**

The styling system is:
- ✅ **100% Tailwind** - No custom CSS needed
- ✅ **Fully overridable** - All 14 style props
- ✅ **Theme-agnostic** - Works with any design system
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Responsive** - Mobile-first defaults
- ✅ **Accessible** - Maintains WCAG compliance

---

**Guide Version:** 2.0.0  
**Last Updated:** November 7, 2025  
**Status:** ✅ **COMPLETE**


