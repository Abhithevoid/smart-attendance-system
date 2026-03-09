// ─── Classroom Locations Database ────────────────────────────────────────────
// This file serves as the master reference for all physical classroom locations.
// Each room has GPS coordinates used for geofencing during attendance marking.
//
// HOW TO GET COORDINATES FOR YOUR COLLEGE:
//   1. Open Google Maps
//   2. Right-click on the classroom building
//   3. Click "What's here?"
//   4. Copy the latitude and longitude shown
//   5. Replace the placeholder values below

const DEFAULT_RADIUS = 100; // metres — default geofence radius

// ─── Building definitions ─────────────────────────────────────────────────────
const BUILDINGS = {
  MAIN_BLOCK: {
    name:    "Main Academic Block",
    code:    "MAB",
    lat:     28.6139,   // ← Replace with your college's actual coordinates
    lng:     77.2090,
  },
  CS_BLOCK: {
    name:    "Computer Science Block",
    code:    "CSB",
    lat:     28.6142,
    lng:     77.2093,
  },
  SCIENCE_BLOCK: {
    name:    "Science Block",
    code:    "SCB",
    lat:     28.6136,
    lng:     77.2087,
  },
  LIBRARY: {
    name:    "Library Building",
    code:    "LIB",
    lat:     28.6145,
    lng:     77.2095,
  },
};

// ─── Classroom locations ──────────────────────────────────────────────────────
const CLASSROOM_LOCATIONS = [

  // ── Main Academic Block ────────────────────────────────────────────────────
  {
    id:       "MAB-101",
    name:     "Room 101",
    building: "Main Academic Block",
    floor:    1,
    capacity: 60,
    lat:      28.6139,
    lng:      77.2090,
    radius:   80,    // tighter radius for smaller room
    type:     "classroom",
  },
  {
    id:       "MAB-201",
    name:     "Room 201",
    building: "Main Academic Block",
    floor:    2,
    capacity: 80,
    lat:      28.6140,
    lng:      77.2091,
    radius:   100,
    type:     "classroom",
  },
  {
    id:       "MAB-301",
    name:     "Seminar Hall",
    building: "Main Academic Block",
    floor:    3,
    capacity: 150,
    lat:      28.6141,
    lng:      77.2092,
    radius:   150,   // larger radius for bigger hall
    type:     "hall",
  },

  // ── Computer Science Block ─────────────────────────────────────────────────
  {
    id:       "CSB-LAB1",
    name:     "CS Lab 1",
    building: "Computer Science Block",
    floor:    1,
    capacity: 40,
    lat:      28.6142,
    lng:      77.2093,
    radius:   75,
    type:     "lab",
  },
  {
    id:       "CSB-LAB2",
    name:     "CS Lab 2",
    building: "Computer Science Block",
    floor:    1,
    capacity: 40,
    lat:      28.6143,
    lng:      77.2094,
    radius:   75,
    type:     "lab",
  },
  {
    id:       "CSB-LAB3",
    name:     "CS Lab 3",
    building: "Computer Science Block",
    floor:    2,
    capacity: 35,
    lat:      28.6144,
    lng:      77.2095,
    radius:   75,
    type:     "lab",
  },
  {
    id:       "CSB-201",
    name:     "CS Room 201",
    building: "Computer Science Block",
    floor:    2,
    capacity: 60,
    lat:      28.6145,
    lng:      77.2096,
    radius:   100,
    type:     "classroom",
  },

  // ── Science Block ──────────────────────────────────────────────────────────
  {
    id:       "SCB-PHY-LAB",
    name:     "Physics Lab",
    building: "Science Block",
    floor:    1,
    capacity: 30,
    lat:      28.6136,
    lng:      77.2087,
    radius:   75,
    type:     "lab",
  },
  {
    id:       "SCB-CHEM-LAB",
    name:     "Chemistry Lab",
    building: "Science Block",
    floor:    2,
    capacity: 30,
    lat:      28.6137,
    lng:      77.2088,
    radius:   75,
    type:     "lab",
  },
  {
    id:       "SCB-101",
    name:     "Science Room 101",
    building: "Science Block",
    floor:    1,
    capacity: 70,
    lat:      28.6138,
    lng:      77.2089,
    radius:   100,
    type:     "classroom",
  },
];

// ─── Helper: get classroom by ID ──────────────────────────────────────────────
const getClassroomById = (id) => {
  return CLASSROOM_LOCATIONS.find(c => c.id === id) || null;
};

// ─── Helper: get classrooms by building ───────────────────────────────────────
const getClassroomsByBuilding = (building) => {
  return CLASSROOM_LOCATIONS.filter(
    c => c.building.toLowerCase().includes(building.toLowerCase())
  );
};

// ─── Helper: get classrooms by type ───────────────────────────────────────────
const getClassroomsByType = (type) => {
  return CLASSROOM_LOCATIONS.filter(c => c.type === type);
};

// ─── Helper: format for dropdown (frontend use) ───────────────────────────────
const getClassroomsForDropdown = () => {
  return CLASSROOM_LOCATIONS.map(c => ({
    value: c.id,
    label: `${c.name} — ${c.building}`,
    lat:   c.lat,
    lng:   c.lng,
    radius: c.radius,
  }));
};

module.exports = {
  CLASSROOM_LOCATIONS,
  BUILDINGS,
  DEFAULT_RADIUS,
  getClassroomById,
  getClassroomsByBuilding,
  getClassroomsByType,
  getClassroomsForDropdown,
};