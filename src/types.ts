export interface Question {
  id: string;
  number: string;
  maxMarks: number;
  type: 'marks' | 'mcq';
  correctAnswer: string;
  module: string[];
  contentArea: string[];
  outcome: string[];
  cognitiveVerb: string[];
  notes: string;
  subQuestions: Question[];
  displayNumber?: string; // Added for rendering
  // FIX: Add optional 'level' property to support question nesting depth.
  level?: number;
}

export interface Student {
  id: string;
  lastName: string;
  firstName: string;
  tags: string[];
  responses: { [questionId: string]: number };
  mcqResponses: { [questionId: string]: string };
}

export interface Template {
    questions: Question[];
    selectedSyllabus: string;
}

export interface AppState {
  questions: Question[];
  students: Student[];
  deleteMode: boolean;
  selectedSyllabus: string;
  selectedStudentId: string | null;
  structureLocked: boolean;
  activeTags: string[];
  rankingSort: { key: string; direction: 'asc' | 'desc' };
}

export type AppAction =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SET_SYLLABUS'; payload: string }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'ADD_STUDENT' }
  | { type: 'BULK_ADD_STUDENTS'; payload: Student[] }
  | { type: 'REMOVE_STUDENT'; payload: string }
  | { type: 'SET_SELECTED_STUDENT'; payload: string | null }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'SET_DELETE_MODE'; payload: boolean }
  | { type: 'SET_STRUCTURE_LOCKED'; payload: boolean }
  | { type: 'SET_ACTIVE_TAGS', payload: string[] }
  | { type: 'SET_RANKING_SORT', payload: { key: string; direction: 'asc' | 'desc' } };
