import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      default: "student",
      enum: ["student", "teacher", "admin"],
    },
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    progress: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        topicComplted: { type: Array, default: [] },
        progressPercentage: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
