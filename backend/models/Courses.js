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
        module_content: [mongoose.Schema.Types.Mixed]
    }],
    total_duration: {
        type: String,
        default: "1 Month"
    },
    endDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

function normalizeCourseTopics(doc) {
  if (doc && doc.modules) {
    doc.modules.forEach(mod => {
      if (mod.module_content) {
        mod.module_content = mod.module_content.map(t => {
          if (typeof t === "string") return { name: t, assignmentLink: "" };
          if (t && typeof t === "object") return { name: t.name || "", assignmentLink: t.assignmentLink || "" };
          return { name: String(t), assignmentLink: "" };
        });
      }
    });
  }
}

courseSchema.post('find', function(docs) {
  if (Array.isArray(docs)) {
    docs.forEach(normalizeCourseTopics);
  } else {
    normalizeCourseTopics(docs);
  }
});

courseSchema.post('findOne', function(doc) {
  normalizeCourseTopics(doc);
});

courseSchema.post('findById', function(doc) {
  normalizeCourseTopics(doc);
});

courseSchema.statics.normalizeTopics = function(moduleContent) {
  if (!moduleContent) return [];
  return moduleContent.map(t => {
    if (typeof t === "string") return { name: t, assignmentLink: "" };
    return { name: t.name || "", assignmentLink: t.assignmentLink || "" };
  });
};

export default mongoose.model('Course', courseSchema);
