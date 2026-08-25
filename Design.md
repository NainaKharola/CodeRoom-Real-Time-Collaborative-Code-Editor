# Design System

# CodeRoom Visual Design System

## 1. Design Direction

CodeRoom should look like a premium modern developer SaaS platform.

The visual language should communicate:

- Technology
- Collaboration
- Speed
- Security
- Professionalism

The design should NOT look like:

- A basic college project
- A generic CRUD dashboard
- A default Bootstrap application
- An overly colorful gaming interface

Primary inspiration:

Modern developer tools and SaaS products.

---

# 2. Theme

Primary theme:

Dark

The application should use a deep dark developer environment with purple/indigo accents.

The design should feel:

- Clean
- Premium
- Minimal
- Technical
- Modern

---

# 3. Primary Colors

## Background

Primary:

#050816

Secondary:

#080B1A

Card:

#0D1224

Elevated Card:

#11172B

Editor Background:

#080C18

---

# 4. Accent Colors

Primary accent:

#7C3AED

Secondary accent:

#6366F1

Bright accent:

#8B5CF6

Purple highlight:

#A78BFA

These colors should be used for:

- Primary buttons
- Active states
- Links
- Focus states
- Important indicators
- Gradients

---

# 5. Text Colors

Primary text:

#F8FAFC

Secondary text:

#CBD5E1

Muted text:

#94A3B8

Disabled text:

#64748B

---

# 6. Status Colors

Success:

#22C55E

Warning:

#F59E0B

Error:

#EF4444

Info:

#3B82F6

Use status colors sparingly.

---

# 7. Borders

Primary border:

#1E293B

Subtle border:

#172033

Active border:

#7C3AED

Borders should generally be subtle.

Avoid strong borders everywhere.

---

# 8. Gradients

Preferred primary gradient:

Purple → Indigo

Example:

#7C3AED → #4F46E5

Use gradients mainly for:

- Hero CTA
- Accent text
- Decorative backgrounds
- Selected elements

Do not use gradients on every component.

---

# 9. Typography

Primary font:

Inter

Fallback:

system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

Code font:

JetBrains Mono

Fallback:

monospace

---

# 10. Typography Scale

Hero Heading:

64px desktop

48px tablet

36px mobile

Hero heading weight:

700–800

---

Hero Subtitle:

18px desktop

16px mobile

Weight:

400

---

Section Heading:

40px desktop

32px mobile

Weight:

700

---

Card Heading:

18–20px

Weight:

600

---

Body:

15–16px

Line height:

1.5–1.7

---

Small text:

12–14px

---

# 11. Hero Design

The hero is the most important visual section.

Layout:

Two columns.

Left:

- Badge
- Main heading
- Description
- Create Room CTA
- Join Room CTA
- Feature highlights

Right:

- Collaborative editor preview

Hero should communicate the product immediately.

---

# 12. Hero Heading

Preferred:

Code Together.
Build Together.

"Code" and "Build" can use the primary purple/indigo gradient.

The rest should use white.

---

# 13. Hero Background

Use:

- Deep navy background
- Very subtle purple glow
- Subtle grid or wave pattern
- Soft radial gradients

Avoid:

- Bright backgrounds
- Excessive particles
- Distracting animations

---

# 14. Navbar

Navbar should be:

- Minimal
- Transparent/dark
- Fixed or sticky if appropriate

Elements:

CodeRoom logo

Features
How It Works
About

Get Started

---

# 15. Buttons

## Primary Button

Purple gradient.

Examples:

Create Room
Get Started

Characteristics:

- Rounded corners
- Medium-large height
- Strong contrast
- Subtle hover glow
- Smooth transition

---

## Secondary Button

Dark transparent background.

Examples:

Join Room

Characteristics:

- Subtle border
- White text
- Purple hover border
- No excessive glow

---

# 16. Cards

Cards should use:

Background:

#0D1224

Border:

#1E293B

Border radius:

12–16px

Shadow:

Subtle

Cards should not appear overly raised.

---

# 17. Glassmorphism

Glassmorphism can be used for:

- Modals
- Hero cards
- Navbar
- Floating panels

Use it subtly.

Do not make the entire application transparent.

---

# 18. Room Interface

The collaborative room should resemble a professional IDE.

Layout:

Top:

Room Header

Middle:

Code Editor + Right Sidebar

Bottom:

Editor Status Bar

Right sidebar:

Participants
Chat

---

# 19. Code Editor

The editor should visually resemble VS Code.

Features:

- Dark background
- Line numbers
- Syntax colors
- Tabs
- Language selector
- Minimap
- Status bar

The editor should be the primary visual focus inside a room.

---

# 20. Participant Design

Each participant row:

Avatar
Name
Status

Host:

Host badge

Online:

Green indicator

Offline:

Muted indicator

---

# 21. Chat Design

Messages should be compact.

Own messages:

Right aligned or visually differentiated.

Other messages:

Left aligned.

Avoid huge chat bubbles.

Show:

Sender
Message
Timestamp

---

# 22. QR Modal

QR modal should use:

- Dark background
- Rounded card
- White QR container
- Purple accent
- Room ID
- Copy Link
- Download QR
- Close

The QR itself must remain high contrast.

---

# 23. Icons

Use Lucide React.

Do not use random emoji icons for core UI.

Recommended icons:

Create Room:
Users / Plus

Join:
LogIn

Share:
Share2

QR:
QrCode

Security:
ShieldCheck

Chat:
MessageCircle

Participants:
Users

Settings:
Settings

Close:
X

Copy:
Copy

---

# 24. Animation

Use subtle animations.

Recommended:

- Fade-in
- Slide-up
- Scale on modal
- Button hover
- Card hover
- Background glow movement

Avoid:

- Excessive bouncing
- Constant spinning
- Large moving objects
- Distracting particle effects

Animation duration:

150–300ms for normal UI.

---

# 25. Spacing

Use a consistent spacing scale.

Prefer:

4
8
12
16
20
24
32
40
48
64
80

Avoid random spacing values.

---

# 26. Border Radius

Small:

6px

Buttons:

8–10px

Cards:

12–16px

Large hero/editor panels:

16–20px

---

# 27. Responsive Design

Desktop:

Primary experience.

Tablet:

Two-column layout may collapse when necessary.

Mobile:

Hero becomes one column.

Editor becomes horizontally scrollable or optimized for smaller screens.

Right sidebar can become tabs:

Participants | Chat

---

# 28. Accessibility

Use:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Sufficient contrast
- Accessible button labels
- aria-label where appropriate

Never rely only on color to communicate status.

---

# 29. Design Consistency Rules

Every page must use the same:

- Colors
- Typography
- Button styles
- Card styles
- Border styles
- Icon style
- Spacing system
- Animation style

Do not introduce new colors without updating this document.

---

# 30. Design Goal

The final product should feel like:

"An actual developer collaboration platform"

rather than:

"An academic CRUD project."