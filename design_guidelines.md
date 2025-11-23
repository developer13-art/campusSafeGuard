# Campus Emergency Alert System - Design Guidelines

## Design Approach

**Selected Framework**: Material Design with enterprise application patterns
**Rationale**: This safety-critical application requires clear hierarchy, strong visual feedback, and reliable component patterns. Material Design provides excellent foundations for forms, notifications, and data-dense dashboards while maintaining accessibility standards.

**Core Principles**:
- **Clarity Over Decoration**: Every element serves a functional purpose
- **Speed of Action**: Critical features accessible within one tap/click
- **Trust Through Consistency**: Predictable patterns reduce cognitive load during stress
- **Mobile-First**: Students will primarily access via smartphones

---

## Typography System

**Font Stack**: 
- Primary: Inter or Roboto (via Google Fonts CDN)
- Monospace: JetBrains Mono (for session IDs, timestamps)

**Hierarchy**:
- Dashboard Headings: text-3xl font-bold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Supporting Text: text-sm
- Captions/Metadata: text-xs
- Emergency Button Text: text-2xl font-bold uppercase tracking-wide

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, and 8** consistently
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card margins: m-4
- Grid gaps: gap-4 to gap-6

**Grid Structures**:
- Mobile: Single column (grid-cols-1)
- Tablet: 2 columns for cards (md:grid-cols-2)
- Desktop: 3-4 columns for analytics (lg:grid-cols-3, xl:grid-cols-4)
- Admin Dashboard: Sidebar + main content (w-64 sidebar, flex-1 main)

**Container Constraints**:
- Max width for content: max-w-7xl
- Form containers: max-w-2xl
- Chat interface: max-w-4xl

---

## Component Library

### Navigation & Layout

**Top Navigation Bar**:
- Fixed position with elevation shadow
- Height: h-16
- Contains: Logo, user role indicator, logout button
- Icons from Heroicons (via CDN)

**Sidebar (Admin/Staff)**:
- Fixed left sidebar: w-64
- Navigation items with icons + labels
- Active state indication with subtle background
- Collapsible on mobile (hamburger menu)

### Emergency Alert Components

**Emergency Button (Student Dashboard)**:
- Prominent placement: Top of dashboard, always visible
- Size: Large touch target (min h-24 w-full on mobile, h-32 on desktop)
- Shape: Rounded corners (rounded-xl)
- Typography: Bold uppercase with icon
- Elevation: Strong shadow (shadow-2xl)
- Pulse animation on idle to draw attention

**Alert Cards (Staff Dashboard)**:
- Elevated cards with border-l-4 indicating priority
- Header: Timestamp + status badge
- Body: Situation summary + location
- Footer: Action buttons (Acknowledge, Dispatch, Resolve)
- Compact view in list, expanded view on click

**Alert Status Flow**:
- Visual progression: Timeline component showing pending → acknowledged → dispatched → resolved
- Each stage with icon + timestamp
- Active stage emphasized with larger icon

### Chat Interface

**Chat Container**:
- Full-height layout (min-h-screen on dedicated page, h-96 in modal)
- Header: "Anonymous Chat - Session #ID" + department badge + close button
- Message area: Scrollable with padding (p-4)
- Input footer: Fixed bottom with textarea + send button + file upload

**Message Bubbles**:
- Student messages: Aligned right, rounded-l-2xl rounded-tr-2xl
- Staff messages: Aligned left, rounded-r-2xl rounded-tl-2xl  
- Padding: px-4 py-2
- Metadata: text-xs timestamp below bubble
- Typing indicator: Three animated dots in staff message position

**Anonymous Identity Badge**:
- Prominent display: "You are User#X8J9K2" in alert/info box at top
- Icon + text combination emphasizing privacy
- Persistent visibility during chat session

### Forms & Inputs

**Input Fields**:
- Standard height: h-12
- Padding: px-4 py-3
- Border: border rounded-lg
- Focus state: ring-2 ring-offset-2
- Labels: text-sm font-medium mb-2

**Emergency Questions**:
- Radio buttons with large touch targets (min-h-12)
- Clear yes/no options or situation descriptors
- Icons accompanying each option for quick scanning
- Progress indicator showing step 1/3, 2/3, 3/3

**Login Forms**:
- Centered layout: max-w-md mx-auto
- Spacing between fields: space-y-4
- Remember me checkbox + forgot password link
- Default accounts listed in help text (text-xs)

### Dashboard Components

**Stats Cards (Admin Analytics)**:
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Card structure: p-6 rounded-xl shadow-md
- Icon: Large size (w-12 h-12) in dedicated area
- Metric: text-3xl font-bold
- Label: text-sm
- Trend indicator: Small text with up/down arrow

**Data Tables**:
- Striped rows for readability (alternate subtle background)
- Header: Sticky top, font-semibold, border-b-2
- Row height: h-16 for comfortable touch targets
- Action column: Right-aligned with icon buttons
- Pagination: Bottom with page numbers + prev/next

**Location Map Display**:
- Card with embedded map (h-64 to h-96)
- Pin showing alert location
- Building name overlay as tooltip
- Zoom controls positioned top-right

### Notifications

**Toast Notifications**:
- Positioned: top-right on desktop, top-center on mobile
- Width: max-w-sm
- Padding: p-4
- Auto-dismiss timer progress bar at bottom
- Close button: top-right corner
- Icon + title + message structure

**Alert Banners (High Priority)**:
- Full-width at top of content area
- Padding: p-4
- Border-l-4 for visual emphasis
- Icon + bold title + description
- Action buttons if required

### Buttons & Actions

**Button Hierarchy**:
- Primary Action: px-6 py-3 rounded-lg font-semibold
- Secondary Action: px-4 py-2 rounded-lg border-2
- Icon Buttons: w-10 h-10 rounded-full
- Text Links: underline-offset-4 hover:underline

**Emergency Action Buttons**: 
- Large: px-8 py-4 text-lg
- High contrast
- Clear icon + text combination
- Minimum touch target 48px × 48px

---

## Responsive Behavior

**Mobile (< 768px)**:
- Single column layouts
- Collapsible sidebar to hamburger menu
- Stacked form fields
- Full-width buttons
- Emergency button: Fixed bottom position alternative for constant access

**Tablet (768px - 1024px)**:
- 2-column grids where appropriate
- Expanded sidebar navigation
- Modal dialogs at comfortable width (max-w-2xl)

**Desktop (> 1024px)**:
- Multi-column analytics dashboards
- Split-screen for chat (list + conversation)
- Persistent sidebar navigation
- Hover states become more prominent

---

## Accessibility Standards

**Consistent Implementation**:
- All interactive elements: Minimum 44px touch target
- Form inputs: Proper label associations, placeholder text as hint only
- Focus indicators: Clear ring-2 on all focusable elements
- ARIA labels for icon-only buttons
- Keyboard navigation: Logical tab order, escape to close modals
- Screen reader announcements for real-time alerts

**Emergency Considerations**:
- High contrast text (WCAG AAA where possible)
- Clear error messaging with corrective actions
- No reliance on color alone for status indication
- Text alternatives for all icons

---

## Animation Guidelines

**Use Sparingly**:
- Emergency button: Subtle pulse animation (animate-pulse) when idle
- Alert notifications: Slide-in from top (transition-transform duration-300)
- Typing indicator: Bounce animation for dots
- Page transitions: Fade-in (transition-opacity duration-200)

**No Animations**:
- Data table updates
- Form submissions
- Button clicks beyond standard active states

---

## Images

**No Hero Images**: This is a utility application focused on function over marketing aesthetics.

**Required Images**:
- Campus map background for location display (low opacity, used as reference layer)
- Department icons: Medical (stethoscope), Security (shield), Guidance (support icon) - use Heroicons
- User avatars: Generic anonymous icons in chat interface
- Empty state illustrations: Simple line art for "No alerts", "No messages"