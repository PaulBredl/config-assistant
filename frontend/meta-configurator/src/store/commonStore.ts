import {ref} from 'vue';
import type {Path} from '@/model/path';
import {defineStore} from 'pinia';
import type {PageName} from '@/router/pageName';

/**
 * Store for common data.
 */
export const useCommonStore = defineStore('commonStore', () => {
  /**
   * The current path in the data tree. List of path keys (or array indices). Empty list for root path.
   */
  const currentPath = ref<Path>([]);
  /**
   * The currently active page.
   */
  const currentPage = ref<PageName>('File');

  return {
    currentPath,
    currentPage,
  };
});
