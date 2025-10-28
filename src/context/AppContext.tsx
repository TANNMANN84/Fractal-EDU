// src/context/AppContext.tsx

import React, { createContext, useReducer, useContext, useEffect, Dispatch, ReactNode } from 'react';
import { produce, Draft } from 'immer';
import { AppState, AppAction, Exam, Question, Student, RapidTest, RapidTestResult } from '../types'; // Import all needed types
import { createStudentObject, updateParentQuestionData } from '../utils/helpers'; // Assuming createQuestionObject is not needed here

// Define initial state matching AppState structure
const initialState: AppState = {
  appMode: 'exam',
  rapidTests: [],
  exams: [],
  activeExamId: null,
  rapidTestStudents: [],
  deleteMode: false,
  selectedStudentId: null,
  activeTags: [],
  rankingSort: { key: 'rank', direction: 'asc' }
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  return produce(state, (draft: Draft<AppState>) => {
    switch (action.type) {
      case 'SET_STATE':
        // Immer special case: return the new state directly
        if (action.payload) {
            const loadedPayload = action.payload as AppState; // Cast for easier access

            // --- MIGRATION LOGIC for single-exam to multi-exam structure ---
            if (!loadedPayload.exams && (loadedPayload as any).questions) {
              console.log("Migrating legacy single-exam state to multi-exam structure.");
              const legacyExam: Exam = {
                id: crypto.randomUUID(),
                name: 'Imported Exam',
                questions: (loadedPayload as any).questions,
                students: (loadedPayload as any).examStudents || (loadedPayload as any).students || [],
                selectedSyllabus: (loadedPayload as any).selectedSyllabus || '',
                structureLocked: (loadedPayload as any).structureLocked || false,
              };
              loadedPayload.exams = [legacyExam];
              loadedPayload.activeExamId = legacyExam.id;

              // Delete old top-level properties
              delete (loadedPayload as any).questions;
              delete (loadedPayload as any).examStudents;
              delete (loadedPayload as any).students;
              delete (loadedPayload as any).selectedSyllabus;
              delete (loadedPayload as any).structureLocked;
            }

            // Provide default appMode if missing (for older exports)
            const finalPayload = { ...loadedPayload, appMode: loadedPayload.appMode || initialState.appMode };

            return { ...initialState, ...finalPayload };
        }
        return state; // Return current state if payload is invalid


      // --- Exam Mode Actions ---
      case 'ADD_EXAM':
        draft.exams.push(action.payload);
        draft.activeExamId = action.payload.id; // Make the new exam active
        break;
      // --- ADD DELETE_EXAM CASE ---
      case 'DELETE_EXAM': {
        const examIdToDelete = action.payload;
        draft.exams = draft.exams.filter(exam => exam.id !== examIdToDelete);
        // If the deleted exam was the active one, reset activeExamId
        if (draft.activeExamId === examIdToDelete) {
          draft.activeExamId = null;
          draft.selectedStudentId = null; // Also clear selected student
        }
        break;
      }
      // --- END ADD ---
      case 'SET_ACTIVE_EXAM':
        draft.activeExamId = action.payload;
        draft.selectedStudentId = null; // Reset student selection when changing exams
        break;
      case 'SET_SYLLABUS':
        const examToUpdateSyllabus = draft.exams.find(e => e.id === action.payload.examId);
        if (examToUpdateSyllabus) {
          examToUpdateSyllabus.selectedSyllabus = action.payload.syllabus;
        }
        break;
      case 'SET_QUESTIONS':
        const examToUpdateQuestions = draft.exams.find(e => e.id === action.payload.examId);
        if (examToUpdateQuestions) {
          examToUpdateQuestions.questions = updateParentQuestionData(Array.isArray(action.payload.questions) ? action.payload.questions : []);
        }
        break;
      case 'SET_STRUCTURE_LOCKED':
        const examToLock = draft.exams.find(e => e.id === action.payload.examId);
        if (examToLock) {
          examToLock.structureLocked = action.payload.locked;
        }
        break;
      case 'SET_EXAM_STUDENTS':
        const examToSetStudents = draft.exams.find(e => e.id === action.payload.examId);
        if (examToSetStudents) {
          examToSetStudents.students = action.payload.students;
        }
        break;

      // --- Student Actions ---
      case 'ADD_STUDENT': {
        const { mode, student } = action.payload;
        const newStudent = student || createStudentObject(); // Use passed student or create new
        const activeExam = draft.exams.find(e => e.id === draft.activeExamId);
        const studentList = mode === 'exam' ? (activeExam ? activeExam.students : draft.rapidTestStudents) : draft.rapidTestStudents;
        studentList.push(newStudent);
        if (mode === 'exam') {
          draft.selectedStudentId = newStudent.id;
        }
        break;
      }
       case 'BULK_ADD_STUDENTS':
         const { students, mode: bulkMode } = action.payload;
         // Ensure payload is an array of valid Student objects
         const activeExam = draft.exams.find(e => e.id === draft.activeExamId);
         if (Array.isArray(students)) {
            // Correctly reference the students array within the active exam
            const studentList = bulkMode === 'exam' ? (activeExam ? activeExam.students : undefined) : draft.rapidTestStudents;

            if (studentList) studentList.push(...students);
         }
         break;
      case 'UPDATE_STUDENT': {
        const { student, mode: updateMode } = action.payload;
        const studentList = updateMode === 'exam' ? draft.exams.find(e => e.id === draft.activeExamId)?.students : draft.rapidTestStudents;
        if (!studentList) break;
        const studentIndex = studentList.findIndex(s => s.id === student.id);
        if (studentIndex !== -1) {
          studentList[studentIndex] = student;
        }
        break;
      }
      case 'REMOVE_STUDENT': {
        const { studentId, mode: removeMode } = action.payload;
        if (removeMode === 'exam') {
          const activeExam = draft.exams.find(e => e.id === draft.activeExamId);
          if (activeExam) {
            activeExam.students = activeExam.students.filter(s => s.id !== studentId);
            if (draft.selectedStudentId === studentId) {
              draft.selectedStudentId = activeExam.students[0]?.id || null;
            }
          }
        } else {
          draft.rapidTestStudents = draft.rapidTestStudents.filter(s => s.id !== studentId);
        }
        break;
      }
      case 'SET_SELECTED_STUDENT':
        draft.selectedStudentId = action.payload;
        break;
      case 'SET_DELETE_MODE':
        draft.deleteMode = action.payload;
        break;

      // --- General Actions ---
      case 'SET_ACTIVE_TAGS':
        draft.activeTags = Array.isArray(action.payload) ? action.payload : [];
        break;
       case 'SET_RANKING_SORT':
         // Add type check if necessary
         draft.rankingSort = action.payload;
         break;
      case 'SET_APP_MODE':
        draft.appMode = action.payload;
        break;

      // --- Rapid Test Actions ---
      case 'ADD_RAPID_TEST':
         // Ensure payload is a valid RapidTest object
         if (action.payload && 'id' in action.payload && 'name' in action.payload) {
            draft.rapidTests.push(action.payload);
         }
        break;
      case 'UPDATE_RAPID_TEST': {
        const testIndex = draft.rapidTests.findIndex(t => t.id === action.payload.id);
        if (testIndex !== -1) {
          // Ensure payload is a valid RapidTest object
           if (action.payload && 'id' in action.payload && 'name' in action.payload) {
             draft.rapidTests[testIndex] = action.payload;
           }
        }
        break;
      }
      case 'DELETE_RAPID_TEST':
        draft.rapidTests = draft.rapidTests.filter(t => t.id !== action.payload);
        break;
      case 'SET_RAPID_TEST_RESULTS': {
        const { testId, studentId, testType, responses } = action.payload;
        const testIndex = draft.rapidTests.findIndex((t) => t.id === testId);
        if (testIndex === -1) {
            console.warn(`SET_RAPID_TEST_RESULTS: Test ID ${testId} not found.`);
            break;
        }

        const currentTest = draft.rapidTests[testIndex];
        if (!currentTest) break;

        let resultIndex = currentTest.results.findIndex(
          (r) => r.studentId === studentId && r.type === testType
        );

        // Calculate total score
        let totalScore = 0;
        const testQuestions = currentTest.questions || []; // Ensure questions array exists
        Object.entries(responses).forEach(([qId, answer]) => {
           const question = testQuestions.find(q => q.id === qId);
           if (!question || question.maxMarks === undefined) return; // Skip if question invalid or no maxMarks

           // Scoring logic based on the updated structure
           if (question.type === 'Spelling' || question.type === 'Matching') {
               if (answer === 'Correct') {
                  totalScore += question.maxMarks;
               }
           } else if (question.type === 'MCQ') {
               if (answer === question.correctAnswer) {
                   totalScore += question.maxMarks;
               }
           } else if (question.type === 'Written' || question.type === 'Marks') {
               const score = Number(answer);
               if (!isNaN(score)) {
                   totalScore += Math.max(0, Math.min(score, question.maxMarks));
               }
           }
        });

        const newResult: RapidTestResult = {
            studentId,
            type: testType,
            responses,
            totalScore
        };

        if (resultIndex === -1) {
          currentTest.results.push(newResult);
        } else {
          currentTest.results[resultIndex] = newResult;
        }
        break;
      }

      default:
        // Ensures type safety - if a new action is added without a case, TypeScript complains
        // Use a type assertion to satisfy TypeScript if needed, but ensure all actions are handled
        try {
            const _exhaustiveCheck: never = action;
        } catch (e) {
            // This error handling might be needed if _exhaustiveCheck causes runtime issues in some JS environments
            console.warn(`Unhandled action type: ${(action as any)?.type}`);
        }
        break; // Let Immer handle returning the original state
    }
  });
};

// --- Context Setup ---
const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | undefined>(undefined);

const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem('examTrackerAutoSession');
    if (serializedState === null) {
        console.log("No saved session found, using initial state.");
        return initialState;
    }
    const loaded = JSON.parse(serializedState);
    // Merge loaded state with initial state to ensure all keys exist & provide defaults
    // Also ensure nested arrays exist
    const mergedState = {
        ...initialState,
        ...loaded,
        exams: Array.isArray(loaded.exams) ? loaded.exams : [],
        rapidTestStudents: Array.isArray(loaded.rapidTestStudents) ? loaded.rapidTestStudents : [],
        rapidTests: Array.isArray(loaded.rapidTests) ? loaded.rapidTests : [],
        activeTags: Array.isArray(loaded.activeTags) ? loaded.activeTags : [],
    };
    console.log("Loaded state from localStorage.");
    return mergedState;
  } catch (err) {
    console.error("Failed to load state from localStorage:", err);
    return initialState;
  }
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, loadState);

  useEffect(() => {
    try {
        localStorage.setItem('examTrackerAutoSession', JSON.stringify(state));
    } catch (err) {
        console.error("Failed to save state to localStorage:", err);
    }
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
