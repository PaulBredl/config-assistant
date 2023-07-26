import type {MenuItemCommandEvent} from 'primevue/menuitem';
import {chooseSchemaFromFile} from '@/components/toolbar/uploadSchema';
import {chooseConfigFromFile} from '@/components/toolbar/uploadConfig';
import {downloadFile} from '@/components/toolbar/downloadFile';
import {schemaCollection} from '@/data/SchemaCollection';
import {useDataStore} from '@/store/dataStore';

import {clearEditor} from '@/components/toolbar/clearContent';
import {generateSampleData} from '@/components/toolbar/createSampleData';
import {ChangeResponsible, useSessionStore} from '@/store/sessionStore';
import {clearSchemaEditor} from '@/components/toolbar/clearSchema';
import {errorService} from '@/main';
import {ref} from 'vue';

/**
 * Helper class that contains the menu items for the top menu bar.
 */
export class TopMenuBar {
  public fetchedSchemas: {label: string; icon: string; command: () => void}[] = [];

  constructor(public onMenuItemClicked: (event: MenuItemCommandEvent) => void) {
    this.fetchWebSchemas();
  }
  public async fetchWebSchemas(): Promise<void> {
    const schemaStoreURL = 'https://www.schemastore.org/api/json/catalog.json';

    try {
      const response = await fetch(schemaStoreURL);
      const data = await response.json();
      const schemas = data.schemas;

      schemas.forEach((schema: {name: string; url: string}) => {
        this.fetchedSchemas.push({
          label: schema.name,
          icon: 'pi pi-fw pi-code',
          command: () => this.selectSchema(schema.url),
        });
      });

      // Show the dialog with the fetched schemas
    } catch (error: Error) {
      errorService.onError({
        message: 'Error fetching web schemas',
        details: error.message,
        stack: error.stack,
      });
    }
  }

  get fileEditorMenuItems() {
    return [
      {
        label: 'File',
        icon: 'pi pi-fw pi-file',
        class: 'z-10', // z-10 is required otherwise the menu is behind the ace editor
        items: [
          {
            label: 'Clear File',
            icon: 'pi pi-fw pi-trash',
            command: this.clearEditor,
          },
          {
            label: 'Upload File',
            icon: 'pi pi-fw pi-upload',
            command: this.chooseConfig,
          },
          {
            label: 'Generate data',
            icon: 'pi pi-fw pi-cog',
            command: this.generateSampleFile,
          },
          {
            separator: true,
          },
          {
            label: 'Download File',
            icon: 'pi pi-fw pi-download',
            command: () => this.downloadFile(useDataStore().schema.title ?? 'file'),
          },
        ],
      },
      {
        label: 'Schema',
        icon: 'pi pi-fw pi-pencil',
        class: 'z-10',
        items: [
          {
            label: 'Upload schema',
            icon: 'pi pi-fw pi-upload',
            command: this.uploadSchema,
          },
          {
            label: 'Choose schema',
            icon: 'pi pi-fw pi-pencil',
            items: schemaCollection.map(schema => ({
              label: schema.label,
              icon: 'pi pi-fw pi-code',
              key: schema.key,
              command: () => this.chooseSchema(schema.key),
            })),
          },
          {
            label: 'Choose SchemaFile',
            icon: 'pi pi-fw pi-upload',
            command: this.openDialog,
          },
        ],
      },

      {
        label: 'Share',
        class: 'z-10',
        icon: 'pi pi-fw pi-share-alt',
        command: this.onMenuItemClicked,
      },
    ];
  }

  get schemaEditorMenuItems() {
    return [
      {
        label: 'Schema',
        icon: 'pi pi-fw pi-file',
        class: 'z-10', // z-10 is required otherwise the menu is behind the ace editor
        items: [
          {
            label: 'Clear Schema',
            icon: 'pi pi-fw pi-trash',
            command: this.clearSchemaEditor,
          },
          {
            label: 'Upload Schema',
            icon: 'pi pi-fw pi-upload',
            command: this.uploadSchema,
          },
          {
            label: 'Choose schema',
            icon: 'pi pi-fw pi-pencil',
            items: schemaCollection.map(schema => ({
              label: schema.label,
              icon: 'pi pi-fw pi-code',
              key: schema.key,
              command: () => this.chooseSchema(schema.key),
            })),
          },
          {
            separator: true,
          },
          {
            label: 'Download Schema',
            icon: 'pi pi-fw pi-download',
            command: () => this.downloadFile('schema_' + useDataStore().schema.title ?? 'untitled'),
          },
        ],
      },

      {
        label: 'Share',
        class: 'z-10',
        icon: 'pi pi-fw pi-share-alt',
        command: this.onMenuItemClicked,
      },
    ];
  }

  get settingsMenuItems() {
    return [];
  }
  private uploadSchema(): void {
    chooseSchemaFromFile();
  }
  private chooseSchema(schemaKey: string): void {
    const selectedSchema: any = schemaCollection.find(schema => schema.key === schemaKey);
    useSessionStore().lastChangeResponsible = ChangeResponsible.Menubar;
    useDataStore().schemaData = selectedSchema?.schema;
  }

  private chooseConfig(): void {
    chooseConfigFromFile();
  }
  private generateSampleFile() {
    const confirmClear = window.confirm(
      'This will delete all the existing data. Are you sure you want to continue?'
    );

    if (confirmClear) {
      useSessionStore().lastChangeResponsible = ChangeResponsible.Menubar;
      generateSampleData(useDataStore().schema.jsonSchema)
        .then(data => (useDataStore().fileData = data))
        .catch((error: Error) =>
          errorService.onError({
            message: 'Error generating sample data',
            details: error.message,
            stack: error.stack,
          })
        );
    }
  }
  private downloadFile(fileNamePrefix: string): void {
    downloadFile(fileNamePrefix);
  }
  private clearEditor(): void {
    clearEditor();
  }
  private clearSchemaEditor(): void {
    clearSchemaEditor();
  }
  public showDialog = ref(false);
  public dialogMessage = ref('');

  public openDialog = (): void => {
    console.log('openDialog function called');
    // Set the message for the dialog
    this.dialogMessage.value = 'Which Schema you want to open?';
    // Show the dialog
    this.showDialog.value = true;
  };
}
