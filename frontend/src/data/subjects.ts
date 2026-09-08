import type { Subject } from "../types/subject";

// Replace null driveUrl values only after destinations are approved for production.
export const localSubjects: readonly Subject[] = [
  {
    id: 1, name: "الرياضيات", slug: "mathematics", icon: "calculator",
    summary: "مسارات الرياضيات للفرعين العلمي والأدبي",
    links: [
      { id: 1, title: "الفرع العلمي", description: "الوصول إلى مجلد مواد الرياضيات للفرع العلمي.", driveUrl: null, sortOrder: 1 },
      { id: 2, title: "الفرع الأدبي", description: "الوصول إلى مجلد مواد الرياضيات للفرع الأدبي.", driveUrl: null, sortOrder: 2 },
    ],
  },
  {
    id: 2, name: "الفيزياء", slug: "physics", icon: "atom",
    summary: "دروس ومواد الفيزياء في وجهة واحدة",
    links: [{ id: 3, title: "فتح المادة", description: "الوصول إلى مجلد الفيزياء المعتمد.", driveUrl: null, sortOrder: 1 }],
  },
  {
    id: 3, name: "الكيمياء", slug: "chemistry", icon: "flask",
    summary: "مواد الكيمياء مرتبة وسهلة الوصول",
    links: [{ id: 4, title: "فتح المادة", description: "الوصول إلى مجلد الكيمياء المعتمد.", driveUrl: null, sortOrder: 1 }],
  },
  {
    id: 4, name: "اللغة العربية", slug: "arabic", icon: "book",
    summary: "محتوى اللغة العربية وفروعها",
    links: [{ id: 5, title: "فتح المادة", description: "الوصول إلى مجلد اللغة العربية المعتمد.", driveUrl: null, sortOrder: 1 }],
  },
  {
    id: 5, name: "اللغة الإنجليزية", slug: "english", icon: "language",
    summary: "مواد اللغة الإنجليزية في مكان واضح",
    links: [{ id: 6, title: "فتح المادة", description: "الوصول إلى مجلد اللغة الإنجليزية المعتمد.", driveUrl: null, sortOrder: 1 }],
  },
  {
    id: 6, name: "أحياء", slug: "biology", icon: "biology",
    summary: "مواد الأحياء في وجهة تعليمية واضحة",
    links: [{ id: 7, title: "فتح المادة", description: "الوصول إلى مجلد الأحياء المعتمد.", driveUrl: null, sortOrder: 1 }],
  },
  {
    id: 7, name: "تكنولوجيا علمي", slug: "technology", icon: "technology",
    summary: "مواد التكنولوجيا للفرع العلمي",
    links: [{ id: 8, title: "فتح المادة", description: "الوصول إلى مجلد تكنولوجيا علمي المعتمد.", driveUrl: null, sortOrder: 1 }],
  },
] as const;
