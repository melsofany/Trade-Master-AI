## Packages
recharts | For the real-time arbitrage spread chart
framer-motion | For smooth page transitions and UI animations
date-fns | For formatting dates in Arabic locale
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes
@radix-ui/react-dialog | For accessible modals (API keys)
@radix-ui/react-switch | For toggle switches
@radix-ui/react-tabs | For organizing settings
@radix-ui/react-select | For dropdown menus
@radix-ui/react-scroll-area | For the AI logs panel
@radix-ui/react-slot | For polymorphic components

## Notes
Tailwind Config: Extend fontFamily to include "Cairo" for Arabic support.
RTL Support: The app requires dir="rtl" on the body or main layout wrapper.
API: Using standard REST endpoints defined in routes.ts.
Auth: Protected routes using useAuth hook.
