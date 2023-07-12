import type {Path} from '@/model/path';
import type {Position} from 'brace';

export interface ConfigManipulator {
  determineCursorPosition(editorContent: string, currentPath: Path): number;
  determinePath(editorContent: string, targetCharacter: number): Path;

  parseFileContent(editorContent: string): any;
  stringifyContentObject(content: any): string;
}
