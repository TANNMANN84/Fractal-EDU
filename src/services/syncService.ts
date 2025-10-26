import { AppState } from '../types';

// --- Local File Save/Load Service ---

/**
 * This function is a placeholder for a future cloud login.
 * For now, it's not needed for local file operations.
 */
export const login = async (): Promise<{ loggedIn: boolean }> => {
  console.log('Login function called, but not implemented for local file storage.');
  return { loggedIn: false };
};

/**
 * Placeholder for logout.
 */
export const logout = async () => {
  console.log('Logout function called, but not implemented for local file storage.');
};

/**
 * Serializes the application state to a JSON file and prompts the user to download it.
 * @param data The entire application state.
 */
export const saveDataToCloud = async (data: AppState): Promise<{ success: boolean }> => {
  try {
    const jsonString = JSON.stringify(data, null, 2); // Pretty-print the JSON
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `fractal-edu-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Data saved to local file.');
    return { success: true };
  } catch (error) {
    console.error('Failed to save data to file:', error);
    alert('An error occurred while trying to save the file.');
    return { success: false };
  }
};

/**
 * Prompts the user to select a JSON file and loads the state from it.
 */
export const loadDataFromCloud = async (): Promise<AppState | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const loadedState = JSON.parse(text) as AppState;
            console.log('Data loaded successfully from file.');
            resolve(loadedState);
          } else {
            throw new Error('File content is not a string.');
          }
        } catch (error) {
          console.error('Failed to parse loaded file:', error);
          alert('Failed to load or parse the selected file. Please ensure it is a valid backup file.');
          resolve(null);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file.');
        alert('An error occurred while reading the file.');
        resolve(null);
      };
      reader.readAsText(file);
    };
    input.click();
  });
};