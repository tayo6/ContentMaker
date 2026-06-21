import { AudioConfig } from './types';

// Helper class to handle the current state across pages
export type EditorStep = 'search' | 'results' | 'resize' | 'text' | 'audio' | 'export';
