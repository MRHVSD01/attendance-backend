const express = require("express");
const multer = require("multer");
const controller = require("../controllers/attendanceController");

const router = express.Router();

// IMPORTANT: no dest when using upload.any() for mixed text + file
const upload = multer();

// SAFETY CHECK (prevents silent crashes)
if (
  !controller.uploadAttendance ||
  !controller.getAttendance ||
  !controller.simulateAttend ||
  !controller.simulateMiss ||
  !controller.targetPlan
) {
  throw new Error(
    "One or more controller functions are not exported correctly"
  );
}

// ROUTES
router.post("/upload", upload.any(), controller.uploadAttendance);
router.get("/attendance", controller.getAttendance);
router.get("/aggregate", controller.getAggregateAttendance);
// router.get("/attendance/aggregate", controller.getAggregateAttendance);
router.post("/target/aggregate", controller.aggregateTargetPlan);
router.post("/simulate/attend", controller.simulateAttend);
router.post("/simulate/miss", controller.simulateMiss);
router.post("/target/subject", controller.aggregateTargetPlan);
router.post("/attendance/reset", controller.resetAttendance);
router.get("/attendance/safe-miss", controller.getSafeMissPerSubject);


module.exports = router;
