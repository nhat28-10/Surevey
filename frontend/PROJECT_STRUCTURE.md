# SureVey - MVC Project Structure

## Overview
SureVey is a survey marketplace built using the **Model-View-Controller (MVC)** architecture pattern with React and TypeScript.

---

## MVC Architecture

### 📊 Model (`/src/app/types/` & `/src/app/services/`)

**Location:**
- `/src/app/types/survey.ts` - Data type definitions
- `/src/app/services/surveyService.ts` - Business logic and data management

**Responsibilities:**
- Define data structures (Survey, SurveyStatus, SurveyFilters)
- Handle data persistence (localStorage)
- Manage business logic (CRUD operations)
- Filter and sort operations
- State management

**Key Functions:**
- `getAllSurveys()` - Retrieve all surveys
- `createSurvey()` - Create new survey
- `getSurveysByOwner()` - Get surveys by owner ID
- `getOpenSurveys()` - Get available surveys with filters
- `acceptSurvey()` - Helper accepts a survey
- `completeSurvey()` - Mark survey as completed
- `cancelSurvey()` - Owner cancels survey
- `deleteSurvey()` - Delete survey

---

### 🎨 View (`/src/app/components/`)

**Location:**
- `/src/app/components/` - All React components (UI layer)

**Main Components:**

1. **Layout.tsx**
   - App navigation and header
   - Role switcher (Owner/Helper)
   - Responsive mobile menu

2. **Home.tsx**
   - Landing page
   - Feature showcase
   - How it works section

3. **OwnerDashboard.tsx**
   - Display owner's surveys
   - Survey statistics
   - Progress indicators
   - Cancel/Delete actions

4. **PostSurvey.tsx**
   - Survey creation form
   - Form validation
   - Input fields for all survey details

5. **HelperMarketplace.tsx**
   - Browse available surveys
   - Filter and sort functionality
   - Accept and complete surveys

6. **NotFound.tsx**
   - 404 error page

**Responsibilities:**
- Render UI components
- Display data from Model
- Capture user interactions
- Pass events to Controller

---

### 🎮 Controller (`/src/app/services/surveyService.ts` + Component Logic)

**Location:**
- Business logic: `/src/app/services/surveyService.ts`
- Event handlers: Within each View component

**Responsibilities:**
- Handle user actions (clicks, form submissions)
- Call Model functions to update data
- Update View based on Model changes
- Manage application state flow

**Controller Flow Examples:**

1. **Creating a Survey:**
   ```
   User fills form (View) 
   → Submit handler (Controller) 
   → createSurvey() (Model) 
   → Update localStorage (Model) 
   → Navigate to dashboard (Controller) 
   → Display updated list (View)
   ```

2. **Accepting a Survey:**
   ```
   User clicks Accept (View) 
   → handleAcceptSurvey() (Controller) 
   → acceptSurvey() (Model) 
   → Update survey status (Model) 
   → Show toast notification (View) 
   → Re-render with updated data (View)
   ```

---

## Project Structure

```
/src/app/
├── types/
│   └── survey.ts              # MODEL: Data type definitions
│
├── services/
│   └── surveyService.ts       # MODEL + CONTROLLER: Business logic
│
├── components/
│   ├── Layout.tsx             # VIEW: App layout and navigation
│   ├── Home.tsx               # VIEW: Landing page
│   ├── OwnerDashboard.tsx     # VIEW + CONTROLLER: Owner's survey list
│   ├── PostSurvey.tsx         # VIEW + CONTROLLER: Create survey form
│   ├── HelperMarketplace.tsx  # VIEW + CONTROLLER: Browse surveys
│   ├── NotFound.tsx           # VIEW: 404 page
│   └── ui/                    # VIEW: Reusable UI components
│
├── routes.ts                  # CONTROLLER: Route configuration
└── App.tsx                    # CONTROLLER: App entry point
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                     USER INTERACTION                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    VIEW COMPONENT                        │
│  (OwnerDashboard, PostSurvey, HelperMarketplace)        │
│  - Renders UI                                            │
│  - Captures user input                                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  CONTROLLER LOGIC                        │
│  (Event handlers in components + routes)                 │
│  - Validates input                                       │
│  - Calls model functions                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   MODEL LAYER                            │
│  (surveyService.ts + types/survey.ts)                    │
│  - Updates data                                          │
│  - Saves to localStorage                                 │
│  - Returns updated data                                  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  VIEW UPDATE                             │
│  - Re-renders with new data                              │
│  - Shows success/error messages                          │
└─────────────────────────────────────────────────────────┘
```

---

## Features

### For Survey Owners:
- ✅ Post surveys with external links
- ✅ Set reward amounts and deadlines
- ✅ Track completion progress
- ✅ View survey status (Open/In Progress/Completed)
- ✅ Cancel surveys (if not started)
- ✅ Delete surveys
- ✅ Dashboard with statistics

### For Survey Helpers:
- ✅ Browse available surveys
- ✅ Filter by reward, time, and deadline
- ✅ Sort surveys
- ✅ Accept surveys
- ✅ Complete surveys and earn rewards
- ✅ Track accepted surveys

---

## Technology Stack

- **Frontend Framework:** React 18.3.1
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)
- **Language:** TypeScript
- **Data Storage:** localStorage (demo/prototype)

---

## Future Enhancements (Supabase Integration)

The current implementation uses localStorage for data persistence, which works for single-user demos. For a production application, consider:

- **User Authentication:** Real user accounts with Supabase Auth
- **Database:** PostgreSQL with Supabase for multi-user support
- **Real-time Updates:** Live survey status updates
- **Payment Integration:** Actual payment processing
- **File Storage:** Survey attachments and documents
- **Analytics:** Advanced reporting and insights

---

## Getting Started

1. Switch between roles using the "Survey Owner" / "Survey Helper" buttons
2. As an **Owner**: Post surveys, track progress, manage your surveys
3. As a **Helper**: Browse available surveys, filter by preferences, complete and earn
4. Data persists in browser localStorage

---

## License

© 2026 SureVey - All rights reserved
