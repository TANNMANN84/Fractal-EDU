import React, { createContext, useReducer, useContext, Dispatch } from 'react';
import { AppState, AppAction } from '../types';
import { createStudentObject } from '../utils/helpers';

const initialState: AppState = {
  questions: [],
  students: [],
  deleteMode: false,
  selectedSyllabus: '',
  selectedStudentId: null,
  structureLocked: false,
  activeTags: [],
  rankingSort: { key: 'rank', direction: 'asc' },
};

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...initialState, ...action.payload };
    case 'SET_SYLLABUS':
      return { ...state, selectedSyllabus: action.payload };
    case 'SET_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'ADD_STUDENT': {
      const newStudent = createStudentObject();
      return {
        ...state,
        students: [...state.students, newStudent],
        selectedStudentId: newStudent.id,
      };
    }
    case 'BULK_ADD_STUDENTS': {
        return {
            ...state,
            students: [...state.students, ...action.payload]
        }
    }
    case 'REMOVE_STUDENT': {
      const newStudents = state.students.filter(s => s.id !== action.payload);
      let newSelectedId = state.selectedStudentId;
      if (state.selectedStudentId === action.payload) {
        newSelectedId = newStudents.length > 0 ? newStudents[0].id : null;
      }
      return { ...state, students: newStudents, selectedStudentId: newSelectedId };
    }
    case 'SET_SELECTED_STUDENT':
      return { ...state, selectedStudentId: action.payload };
    case 'UPDATE_STUDENT': {
        const studentIndex = state.students.findIndex(s => s.id === action.payload.id);
        if (studentIndex === -1) return state;
        const newStudents = [...state.students];
        newStudents[studentIndex] = action.payload;
        return { ...state, students: newStudents };
    }
    case 'SET_DELETE_MODE':
        return { ...state, deleteMode: action.payload };
    case 'SET_STRUCTURE_LOCKED':
        return { ...state, structureLocked: action.payload };
    case 'SET_ACTIVE_TAGS':
        return { ...state, activeTags: action.payload };
    case 'SET_RANKING_SORT':
        return { ...state, rankingSort: action.payload };
    default:
      return state;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);