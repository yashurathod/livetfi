# Trip Path Classification System

## Problem Solved
When multiple buses serve the same stop (e.g., Wilton Stop in Cork), users need to distinguish between buses coming from different origins and heading to different destinations. For example:
- **Bus from CUH → Western Gateway** (for users heading west)
- **Bus from City Centre → Eastern District** (for users heading east)

## Solution: Full Trip Path Display

### Data Structure
Each bus and arrival now includes:
- `origin`: The starting point of the route (extracted from route metadata)
- `destination`: The final destination (from trip headsign or route metadata)
- `fullTrip`: Combined display string like **"from CUH → Western Gateway"**

### Where Origin is Extracted From
The system uses the route's `long_name` from GTFS static data, which typically follows the pattern:
```
"Origin - Destination"
```

For example:
- `"Cork - Wilton"` → origin: Cork, destination: Wilton
- `"CUH - Western Gateway"` → origin: CUH, destination: Western Gateway
- `"Dublin City Centre - Bray"` → origin: Dublin City Centre, destination: Bray

### Direction-Aware Classification
The `direction_id` field from GTFS indicates if a bus is going the reverse direction:
- **direction_id = 0**: Normal direction (A → B)
- **direction_id = 1**: Reverse direction (B → A)

The system automatically swaps origin and destination based on direction_id to show accurate "from X → Y" information.

## User Interface

### Bus Popup (Map View)
When clicking on a live bus marker, the popup shows:
```
[208] Dublin Bus
from CUH → Western Gateway
Next: Wilton Stop
On time
```

Instead of just showing "towards Western Gateway" which doesn't indicate where the bus came from.

### Stop Detail Sheet
When selecting a stop, the upcoming arrivals are sorted by arrival time and show:
```
[208] from CUH → Western Gateway
Dublin Bus · 12:34 PM
5 min
```

This lets users quickly identify which bus serves their desired route pattern.

### Search Results
Route search shows the full route long_name, providing context about direction:
```
Routes (3)
├─ 208 (Cork - Wilton)
├─ 208 (Wilton - Cork)
└─ 120 (Cork - Airport)
```

## Implementation Details

### Code Functions

#### `extractOriginFromRouteLongName(longName, directionId)`
Extracts the origin location from route metadata:
```typescript
// Input: "CUH - Western Gateway", directionId: 0
// Output: "CUH"
```

#### `buildFullTrip(origin, destination)`
Builds the display string with intelligent fallback:
```typescript
// Input: origin="CUH", destination="Western Gateway"
// Output: "from CUH → Western Gateway"

// Input: origin="", destination="Western Gateway"
// Output: "towards Western Gateway"

// Input: origin="CUH", destination=""
// Output: "from CUH"
```

### Data Integration Points

1. **BusPosition** (live vehicle data):
   - Gets origin from route metadata
   - Calculates fullTrip
   - Displayed in map popups

2. **Arrival** (scheduled upcoming buses):
   - Stores origin alongside destination
   - Pre-computes fullTrip string
   - Shown in stop detail sheets

3. **SearchScreen**:
   - Route long_name provides directional context
   - Helps users understand route patterns before selection

## Fallback Chain for Missing Data

If origin cannot be extracted (e.g., malformed long_name):
1. Try parsing route long_name → "Origin - Destination"
2. Use direction_id to determine which endpoint is origin
3. If only destination available → show "towards <destination>"
4. If only origin available → show "from <origin>"
5. Default → "In service"

## Data Quality Notes

- **Realtime precision**: Some trips may have outdated or missing origin metadata, especially for regional/rural routes
- **GTFS coverage**: Origin extraction depends on route metadata in GTFS feeds; not all operators provide detailed long_names
- **Direction consistency**: direction_id is the primary indicator for swapping origin/destination for reverse routes

## Testing Scenarios

✓ **Scenario 1**: Cork Wilton Stop with multiple buses
  - Bus 208 from CUH → Western Gateway
  - Bus 208 from Western Gateway → CUH
  - User can easily distinguish which direction

✓ **Scenario 2**: Single origin-destination route
  - Shows "from A → B" consistently regardless of direction_id

✓ **Scenario 3**: Route with missing origin data
  - Falls back to "towards <destination>" gracefully

✓ **Scenario 4**: Dynamic vehicle focus from Search
  - Clicking route 208 filters map to show only that route's live buses
  - Each bus popup shows full trip path including origin
