import { localSubjects } from "../data/subjects";
import type { Subject } from "../types/subject";

export interface SubjectService {
  getSubjects(): Promise<readonly Subject[]>;
  getSubjectBySlug(slug: string): Promise<Subject | null>;
}

class LocalSubjectService implements SubjectService {
  async getSubjects() { return Promise.resolve(localSubjects); }
  async getSubjectBySlug(slug: string) {
    return Promise.resolve(localSubjects.find((subject) => subject.slug === slug) ?? null);
  }
}

export const subjectService: SubjectService = new LocalSubjectService();
