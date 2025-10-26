// src/context/AppContext.tsx

import React, { createContext, useReducer, useContext, useEffect, Dispatch, ReactNode } from 'react';
import { produce, Draft } from 'immer';
import { AppState, AppAction, Question, Student, RapidTest, RapidTestResult } from '../types'; // Import all needed types
import { createStudentObject, updateParentQuestionData } from '../utils/helpers'; // Assuming createQuestionObject is not needed here

// Define initial state matching AppState structure
const initialState: AppState = {
  appMode: 'exam',
  rapidTests: [],
  questions: [], // exam questions
  examStudents: [],
  rapidTestStudents: [],
  selectedSyllabus: '',
  deleteMode: false,
  selectedStudentId: null,
  structureLocked: false,
  activeTags: [],
  rankingSort: { key: 'rank', direction: 'asc' },
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  return produce(state, (draft: Draft<AppState>) => {
    switch (action.type) {
      case 'SET_STATE':
        // Immer special case: return the new state directly
        // Make sure the payload conforms to AppState. Basic check for essential properties.
        if (action.payload && 'appMode' in action.payload && 'questions' in action.payload && 'examStudents' in action.payload) {
            // Merge with initial state to ensure all keys exist
            return { ...initialState, ...action.payload };
        }
        console.error("SET_STATE received invalid payload:", action.payload);
        return state; // Return current state if payload is invalid


      // --- Exam Mode Actions ---
      case 'SET_SYLLABUS':
        draft.selectedSyllabus = action.payload;
        break;
      case 'SET_QUESTIONS':
        // Ensure payload is an array and update parent data
        draft.questions = updateParentQuestionData(Array.isArray(action.payload) ? action.payload : []);
        break;
      case 'SET_STRUCTURE_LOCKED':
        draft.structureLocked = action.payload;
        break;

      // --- Student Actions ---
      case 'ADD_STUDENT': {
        const { mode, student } = action.payload;
        const newStudent = student || createStudentObject(); // Use passed student or create new
        const studentList = mode === 'exam' ? draft.examStudents : draft.rapidTestStudents;
        studentList.push(newStudent);
        if (mode === 'exam') {
          draft.selectedStudentId = newStudent.id;
        }
        break;
      }
       case 'BULK_ADD_STUDENTS':
         const { students, mode: bulkMode } = action.payload;
         // Ensure payload is an array of valid Student objects
         if (Array.isArray(students)) {
            const studentList = bulkMode === 'exam' ? draft.examStudents : draft.rapidTestStudents;
            studentList.push(...students);
         }
         break;
      case 'UPDATE_STUDENT': {
        const { student, mode: updateMode } = action.payload;
        const studentList = updateMode === 'exam' ? draft.examStudents : draft.rapidTestStudents;
        const studentIndex = studentList.findIndex(s => s.id === student.id);
        if (studentIndex !== -1) {
          studentList[studentIndex] = student;
        }
        break;
      }
      case 'REMOVE_STUDENT':
        const { studentId, mode: removeMode } = action.payload;
        if (removeMode === 'exam') {
          draft.examStudents = draft.examStudents.filter(s => s.id !== studentId);
          if (draft.selectedStudentId === studentId) {
            draft.selectedStudentId = draft.examStudents[0]?.id || null;
          }
        } else {
          draft.rapidTestStudents = draft.rapidTestStudents.filter(s => s.id !== studentId);
        }
        break;
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
        const _exhaustiveCheck: never = action;
        console.warn(`Unhandled action type: ${(_exhaustiveCheck as any)?.type}`);
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
        questions: Array.isArray(loaded.questions) ? loaded.questions : [],
        examStudents: Array.isArray(loaded.examStudents) ? loaded.examStudents : (Array.isArray(loaded.students) ? loaded.students : []), // Migration from old `students` key
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