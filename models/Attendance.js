// const mongoose = require("mongoose");

// const attendanceSchema = new mongoose.Schema({
//   subjectCode: String,
//   subjectName: String,
//   subjectType: String,
//   attended: Number,
//   total: Number,
//   percentage: Number,
//   riskLevel: String,
//   uploadedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Attendance", attendanceSchema);

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  subjectCode: String,
  subjectName: String,
  subjectType: String,

  // CURRENT (mutable)
  attended: Number,
  total: Number,
  percentage: Number,
  riskLevel: String,

  // ORIGINAL (immutable reference)
  originalAttended: Number,
  originalTotal: Number,
  originalPercentage: Number,
  originalRiskLevel: String,

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Attendance", attendanceSchema);
