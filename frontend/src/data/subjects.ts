import type { Subject } from "../types/subject";

export const localSubjects: readonly Subject[] = [
  {
    id: 1, gradeId: "tawjihi", name: "الرياضيات", slug: "mathematics", icon: "calculator",
    summary: "مسارات الرياضيات للفرعين العلمي والأدبي",
    links: [
      { id: 1, title: "الفرع العلمي", description: "الوصول إلى مجلد مواد الرياضيات للفرع العلمي.", driveUrl: "https://drive.google.com/drive/folders/1dJ20sK1leOwIqNEyRredG2_nvoAyWSpp", sortOrder: 1 },
      { id: 2, title: "الفرع الأدبي", description: "الوصول إلى مجلد مواد الرياضيات للفرع الأدبي.", driveUrl: "https://drive.google.com/drive/folders/1Tdl15mvbF6Se6f1nnu0dG_AD8S9IPi9_", sortOrder: 2 },
    ],
  },
  {
    id: 2, gradeId: "tawjihi", name: "الفيزياء", slug: "physics", icon: "atom",
    summary: "دروس ومواد الفيزياء في وجهة واحدة",
    links: [{ id: 3, title: "فتح المادة", description: "الوصول إلى مجلد الفيزياء المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1MwnYVZu_Z5w3C3ERaQbe4-CU1aNseHlZ", sortOrder: 1 }],
  },
  {
    id: 3, gradeId: "tawjihi", name: "الكيمياء", slug: "chemistry", icon: "flask",
    summary: "مواد الكيمياء مرتبة وسهلة الوصول",
    links: [{ id: 4, title: "فتح المادة", description: "الوصول إلى مجلد الكيمياء المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1Jp9mPKIhYXTQygy609Ago0bTt6lNu9WC", sortOrder: 1 }],
  },
  {
    id: 4, gradeId: "tawjihi", name: "اللغة العربية", slug: "arabic", icon: "book",
    summary: "محتوى اللغة العربية وفروعها",
    links: [{ id: 5, title: "فتح المادة", description: "الوصول إلى مجلد اللغة العربية المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1balI8n1zsb5UYfKY9JpjxyixIj7Fue_s", sortOrder: 1 }],
  },
  {
    id: 5, gradeId: "tawjihi", name: "اللغة الإنجليزية", slug: "english", icon: "language",
    summary: "مواد اللغة الإنجليزية في مكان واضح",
    links: [{ id: 6, title: "فتح المادة", description: "الوصول إلى مجلد اللغة الإنجليزية المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1ctL8SH4MSuqZi3cFq66ckZSShtJTLx7m", sortOrder: 1 }],
  },
  {
    id: 6, gradeId: "tawjihi", name: "أحياء", slug: "biology", icon: "biology",
    summary: "مواد الأحياء في وجهة تعليمية واضحة",
    links: [{ id: 7, title: "فتح المادة", description: "الوصول إلى مجلد الأحياء المعتمد.", driveUrl: "https://drive.google.com/drive/folders/1enC_4e_wSMM63KGK_vUUkIF_qpDW9Uea", sortOrder: 1 }],
  },
  {
    id: 7, gradeId: "tawjihi", name: "تكنولوجيا علمي", slug: "technology", icon: "technology",
    summary: "مواد التكنولوجيا للفرع العلمي",
    links: [{ id: 8, title: "فتح المادة", description: "الوصول إلى مجلد تكنولوجيا علمي المعتمد.", driveUrl: "https://drive.google.com/drive/folders/14H3v5eK7JtObTqXcnmuM7jlNItzlGSKC", sortOrder: 1 }],
  },
] as const;
