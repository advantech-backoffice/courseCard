import mongoose from "mongoose";

/*
    Courses model
        - course_id: int, primary key
        - course_name: string
        course_description: string
        modules: {module_id: int, module_name: string,module_content: []}[]
        timestamp: date
*/
const courseSchema = new mongoose.Schema({
    course_id: {
        type: Number,
        primaryKey: true,
        required: true
    },
    course_name: {
        type: String,
        required: true
    },
    course_description: {
        type: String,
        required: true
    },
    modules: [{
        module_id: Number,
        module_name: String,
        module_content: [String]
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Course', courseSchema);