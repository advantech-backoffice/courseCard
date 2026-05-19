import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student"
    },
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // For teachers
    progress: [
      {
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        completedTopics: [
          {
            topicKey: { type: String, required: true }, // e.g. "moduleId-topicName"
            completedAt: { type: Date, default: Date.now }
          }
        ],
        progressPercentage: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
