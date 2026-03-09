const Classroom = require("../models/Classroom");

// ─── POST /api/classroom ──────────────────────────────────────────────────────
// @desc   Create a new classroom
// @access Admin only
const createClassroom = async (req, res) => {
  try {
    const {
      name, code, building, floor, capacity,
      type, coordinates, radius, facilities, notes,
    } = req.body;

    // Check code uniqueness
    const existing = await Classroom.findOne({ code: code?.toUpperCase() });
    if (existing) {
      return res.status(400).json({
        message: `Classroom code ${code.toUpperCase()} already exists`,
      });
    }

    const classroom = await Classroom.create({
      name, code, building,
      floor:       floor       ?? 1,
      capacity:    capacity    ?? 30,
      type:        type        || "classroom",
      coordinates: coordinates || { lat: null, lng: null },
      radius:      radius      ?? 100,
      facilities:  facilities  || {},
      notes:       notes       || "",
    });

    return res.status(201).json({
      message:   "Classroom created successfully",
      classroom,
    });
  } catch (error) {
    console.error("createClassroom error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "Classroom code already exists" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/classroom/all ───────────────────────────────────────────────────
// @desc   Get all classrooms (with optional filters)
// @access All authenticated
const getAllClassrooms = async (req, res) => {
  try {
    const {
      building, type, isActive,
      search, hasCoordinates,
      page = 1, limit = 50,
    } = req.query;

    const query = {};
    if (building)            query.building = { $regex: building, $options: "i" };
    if (type)                query.type     = type;
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (search) {
      query.$or = [
        { name:     { $regex: search, $options: "i" } },
        { code:     { $regex: search, $options: "i" } },
        { building: { $regex: search, $options: "i" } },
      ];
    }
    // Filter by whether GPS coordinates are set
    if (hasCoordinates === "true") {
      query["coordinates.lat"] = { $ne: null };
      query["coordinates.lng"] = { $ne: null };
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));

    const [classrooms, total] = await Promise.all([
      Classroom.find(query)
               .sort({ building: 1, name: 1 })
               .skip((pageNum - 1) * limitNum)
               .limit(limitNum),
      Classroom.countDocuments(query),
    ]);

    return res.json({ classrooms, total, page: pageNum });
  } catch (error) {
    console.error("getAllClassrooms error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/classroom/dropdown ─────────────────────────────────────────────
// @desc   Get classrooms formatted for frontend select dropdown
// @access All authenticated
const getClassroomsDropdown = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ isActive: true })
                                      .sort({ building: 1, name: 1 })
                                      .select("name code building coordinates radius type");

    const dropdown = classrooms.map(c => ({
      value:   c._id,
      label:   `${c.name} — ${c.building}`,
      code:    c.code,
      lat:     c.coordinates?.lat   || null,
      lng:     c.coordinates?.lng   || null,
      radius:  c.radius,
      type:    c.type,
    }));

    return res.json({ classrooms: dropdown, total: dropdown.length });
  } catch (error) {
    console.error("getClassroomsDropdown error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── GET /api/classroom/:id ───────────────────────────────────────────────────
// @desc   Get single classroom
// @access All authenticated
const getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }
    return res.json({ classroom });
  } catch (error) {
    console.error("getClassroomById error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Classroom not found" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── PUT /api/classroom/:id ───────────────────────────────────────────────────
// @desc   Update classroom
// @access Admin only
const updateClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    const allowed = [
      "name", "building", "floor", "capacity",
      "type", "coordinates", "radius",
      "facilities", "isActive", "notes",
    ];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) classroom[field] = req.body[field];
    });

    // Admin can change code (check uniqueness)
    if (req.body.code) {
      const exists = await Classroom.findOne({
        code: req.body.code.toUpperCase(),
        _id:  { $ne: req.params.id },
      });
      if (exists) {
        return res.status(400).json({ message: "Classroom code already in use" });
      }
      classroom.code = req.body.code.toUpperCase();
    }

    const updated = await classroom.save();
    return res.json({
      message:   "Classroom updated successfully",
      classroom: updated,
    });
  } catch (error) {
    console.error("updateClassroom error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: Object.values(error.errors)[0].message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── DELETE /api/classroom/:id ────────────────────────────────────────────────
// @desc   Delete classroom (admin only)
// @access Admin only
const deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    await classroom.deleteOne();
    return res.json({
      message:           "Classroom deleted successfully",
      deletedClassroom:  { _id: classroom._id, name: classroom.name, code: classroom.code },
    });
  } catch (error) {
    console.error("deleteClassroom error:", error.message);
    if (error.kind === "ObjectId") {
      return res.status(404).json({ message: "Classroom not found" });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── PATCH /api/classroom/:id/toggle ─────────────────────────────────────────
// @desc   Toggle classroom active/inactive
// @access Admin only
const toggleClassroomStatus = async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    classroom.isActive = !classroom.isActive;
    await classroom.save();

    return res.json({
      message:   `Classroom ${classroom.isActive ? "activated" : "deactivated"} successfully`,
      classroom: { _id: classroom._id, name: classroom.name, isActive: classroom.isActive },
    });
  } catch (error) {
    console.error("toggleClassroomStatus error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─── POST /api/classroom/seed ─────────────────────────────────────────────────
// @desc   Seed default classrooms from config file into DB
// @access Admin only
const seedClassrooms = async (req, res) => {
  try {
    const seeded = await Classroom.seedDefaults();
    const total  = await Classroom.countDocuments();

    return res.json({
      message: seeded > 0
        ? `Successfully seeded ${seeded} classrooms into database`
        : "All default classrooms already exist in database",
      seeded,
      total,
    });
  } catch (error) {
    console.error("seedClassrooms error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createClassroom,
  getAllClassrooms,
  getClassroomsDropdown,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
  toggleClassroomStatus,
  seedClassrooms,
};