# KPI Diagram Application - Implementation Guide

## 1. Project Overview
This application is a **KPI (Key Performance Indicator) Visualization and Calculation Tool**. It allows users to visualize financial or operational data in a tree structure (Arborescence), modify base values, and automatically recalculate affected nodes based on predefined formulas.

The project is structured as a **Client-Server** architecture (Monorepo).

## 2. Technology Stack

### Frontend (`/client`)
- **Framework**: React 19 (created with Create React App)
- **Styling**: TailwindCSS
- **Visualization**: React Flow (for the diagram/tree view), Recharts (for charts)
- **HTTP Client**: Axios
- **State Management**: React State / Hooks

### Backend (`/server`)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Data Processing**: `xlsx` (for reading Excel files)

## 3. Architecture & Data Flow

1.  **Initialization**:
    -   The server connects to MongoDB.
    -   Data is often seeded or updated from Excel files (using `saveToDatabase` controllers).

2.  **Data Structure (Database)**:
    -   The core model is **`Arborescence2`** (stored in `server/models/Arborescence2.model.js`).
    -   Each document represents a **Node** in the KPI tree.
    -   **Key Fields**:
        -   `parentId`: ID of the node (e.g., 'EC001'). *Note: The naming is slightly confusing, `parentId` here acts as the Node's own ID.*
        -   `childrenIds`: Array of IDs that are children of this node.
        -   `formula`: Mathematical formula to calculate this node's value (e.g., `EC002 + EC003` or complex arithmetic).
        -   `SoldeValue`: The initial/base value.
        -   `newSold`: The recalculated value after user input.
        -   `category`: e.g., "Elément de base" (editable) or "Elément calculé" (computed).

3.  **Calculation Engine (`server/controllers/ArborescenceCalcul.js`)**:
    -   This is the heart of the application.
    -   When a user updates a base value, the frontend sends the modified inputs to `/api/calculation`.
    -   The server performs an iterative calculation:
        1.  It identifies which nodes are affected.
        2.  It parses the `formula` string for each node.
        3.  It replaces node references (e.g., `EC123`) with their current values.
        4.  It evaluates the formula safely.
        5.  It updates the `newSold` values in the database.

## 4. API Endpoints (`server/routes/routes.js`)

| Method | Endpoint | Controller | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/data` | `saveToDatabase` | Seeding/Importing data (likely from Excel). |
| `GET` | `/api/node/:id` | `getNodeById` | Fetch a specific node's details. |
| `POST` | `/api/calculation` | `ArborescenceCalcul` | **Critical**: Triggers recalculation of the tree based on inputs. |
| `GET` | `/api/reset` | `resetNewSold` | Resets simulations to default values. |
| `POST` | `/api/reports` | `modelsReports` | Generates reports. |
| `POST` | `/api/search` | `searchForBE` | Search functionality. |

## 5. Implementation Steps (How it was built)

To recreate or understand the current state, these were likely the steps taken:

### Step 1: Backend Setup
1.  **Express Server**: Created `server/app.js` with CORS and JSON parsing.
2.  **Database Connection**: Configured MongoDB connection in `app.js` using `.env`.
3.  **Models**: Defined `Arborescence2.model.js` to structure the tree data.
4.  **Import Logic**: Implemented `saveToDatabase` to read an Excel file (`Arborescence2.xlsx`) and populate the MongoDB collection. This allows dynamic definition of the tree structure outside the code.

### Step 2: Calculation Logic
1.  **Formula Parsing**: Created logic in `ArborescenceCalcul.js` to regex-match node IDs in formulas and replace them with values.
2.  **Topological implementation**: The logic iterates through the tree to propagate changes from leaf nodes (Base Elements) up to the root.

### Step 3: Frontend Setup
1.  **React App**: Initialized with `create-react-app`.
2.  **Tailwind**: Configured for styling.
3.  **Components**:
    -   `KPIDiagram2`: The main container.
    -   **React Flow Integration**: Mapped the API data to Nodes and Edges compatible with React Flow.
    -   **Interactivity**: When a node is clicked, an input form likely appears. Submitting this form calls the `/api/calculation` endpoint.

## 6. Upcoming: Authentication Implementation
*As requested, you are planning to add authentication. Here is where it fits:*

1.  **Backend**:
    -   Need a **User Model** (`name`, `email`, `password`, `role`).
    -   Need **Auth Routes** (`/api/auth/register`, `/api/auth/login`).
    -   Need **Middleware** (`verifyToken`) to protect routes like `/api/calculation` or `/api/reset` so only authorized users can modify data.
    -   Use `jsonwebtoken` (JWT) and `bcryptjs`.

2.  **Frontend**:
    -   Create **Login/Register Pages**.
    -   Store JWT in `localStorage` or `cookies`.
    -   Add an `AuthContext` to manage user state.
    -   Protect routes (e.g., redirect to login if not authenticated).


This guide captures the current functional state of the application.

## 7. Multi-Client Architecture Strategy

To support multiple clients (users) where each user has their own private calculations, you must modify the "Shared State" architecture.

### The Problem (Current State)
Currently, the app is **Single-Tenant**. Use `ArborescenceCalcul.js` lines 169-183:
```javascript
await Arborescence.bulkWrite(operations);
```
This updates the **global** database. If User A changes a number, User B sees the result. This is unacceptable for a multi-user app.

### The Solution (Multi-Tenant)

#### 1. Database Schema Changes
You need to separate the **Static Structure** (the KPI Logic) from the **Dynamic Data** (User Values).

**A. User Model (New)**
Store client identity.
```javascript
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  companyName: { type: String }, // Optional: If you group users by company
  createdAt: { type: Date, default: Date.now }
});
```

**B. Simulation/Save Model (New)**
Instead of writing `newSold` to the `Arborescence2` collection, create a `UserSimulation` or `Workspace` collection.
```javascript
const SimulationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, default: 'My Scenario 1' },
  // Store ONLY the values that differ from the base, or the calculated results
  nodeValues: [{
    nodeId: String, // e.g., 'EC048'
    baseValue: Number, // Input by user
    calculatedValue: Number // Result
  }],
  lastModified: Date
});
```

#### 2. Workflow Changes

1.  **Registration (What to take from Clients)**:
    *   **Essential**: `Email`, `Password`, `Full Name`.
    *   **Contextual**: `Industry` or `Company Name` (if the KPI formulas vary by industry).
    *   **Data**: Does the client bring their *own* Excel sheet?
        *   *If YES*: You need a file upload feature to parse their structure into a `UserArborescence` collection.
        *   *If NO (Standard Logic)*: They just sign up and start with the default tree.

2.  **Calculation Logic Adjustment**:
    *   **Frontend**: When calling `/api/calculation`, send the `token` (Auth) to identify the user.
    *   **Backend**:
        1.  Fetch the standard `Arborescence` (Formulas/Structure).
        2.  Fetch the user's saved inputs (from `UserSimulation`).
        3.  Run the calculation in memory.
        4.  **DO NOT** `bulkWrite` to the main `Arborescence` collection.
        5.  **DO** save the results to the user's `UserSimulation` document OR return them directly to the frontend.

### Summary of Required "Takes" from Clients
1.  **Identity**: Who are they? (Auth)
2.  **State**: What are their current input variables? (Saved separately from the global tree)
3.  **Isolation**: Ensure `App.js` requests include user context so they never see another client's computed `newSold`.
