import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    course_name: {
        type: String,
        required: true
    },
    course_description: {
        type: String
    },
    modules: [{
        module_name: { type: String, required: true },
        module_content: [String]
    }],
    endDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);