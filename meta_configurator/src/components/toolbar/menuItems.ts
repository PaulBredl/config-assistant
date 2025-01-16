import {openUploadFileDialog, openUploadSchemaDialog} from '@/components/toolbar/uploadFile';
import {downloadFile} from '@/components/toolbar/downloadFile';
import {clearCurrentFile} from '@/components/toolbar/clearFile';
import {useSessionStore} from '@/store/sessionStore';
import {ref} from 'vue';
import type {SchemaOption} from '@/packaged-schemas/schemaOption';
import {openGenerateDataDialog} from '@/components/toolbar/createSampleData';
import {getDataForMode, useCurrentData, useCurrentSchema} from '@/data/useDataLink';
import {useDataSource} from '@/data/dataSource';
import {SessionMode} from '@/store/sessionMode';
import {SETTINGS_DATA_DEFAULT} from '@/settings/defaultSettingsData';
import type {SettingsInterfaceRoot} from '@/settings/settingsTypes';
import type {MenuItem} from 'primevue/menuitem';
import {panelTypeRegistry} from '@/components/panels/panelTypeRegistry';
import {panelTypeGuiEditor} from '@/components/panels/defaultPanelTypes';

/**
 * Helper class that contains the menu items for the top menu bar.
 */
export class MenuItems {
  sessionStore = useSessionStore();
  public fetchedSchemas: SchemaOption[] = [];
  public showDialog = ref(false);

  private readonly onFromWebClick: () => Promise<void>;
  private readonly onFromOurExampleClick: () => void;
  private readonly handleFromURLClick: () => void;
  private readonly showImportCsvDialog: () => void;
  private readonly showSnapshotDialog: () => void;
  private readonly inferJsonSchemaFromSampleData: () => void;

  constructor(
    onFromSchemaStoreClick: () => Promise<void>,
    onFromOurExampleClick: () => void,
    onFromURLClick: () => void,
    showImportCsvDialog: () => void,
    showSnapshotDialog: () => void,
    inferJsonSchemaFromSampleData: () => void
  ) {
    this.onFromWebClick = onFromSchemaStoreClick;
    this.onFromOurExampleClick = onFromOurExampleClick;
    this.handleFromURLClick = onFromURLClick;
    this.showImportCsvDialog = showImportCsvDialog;
    this.showSnapshotDialog = showSnapshotDialog;
    this.inferJsonSchemaFromSampleData = inferJsonSchemaFromSampleData;
  }

  public getDataEditorMenuItems(settings: SettingsInterfaceRoot): MenuItem[] {
    let result: MenuItem[] = [
      {
        label: 'New Data...',
        icon: 'fa-regular fa-file',
        items: [
          {
            label: 'Clear Data',
            icon: 'fa-regular fa-file',
            command: clearCurrentFile,
          },
          {
            label: 'Generate Data...',
            icon: 'fa-solid fa-gears',
            command: openGenerateDataDialog,
            disabled: true, // currently not working in the deployed version
          },
        ],
      },
      {
        label: 'Open Data',
        icon: 'fa-regular fa-folder-open',
        command: () => openUploadFileDialog(getDataForMode(SessionMode.DataEditor)),
      },
      {
        label: 'Import Data...',
        icon: 'fa-solid fa-file-import',
        items: [
          {
            label: 'Import CSV Data',
            icon: 'fa-solid fa-table',
            command: this.showImportCsvDialog,
          },
        ],
      },
      {
        label: 'Download Data',
        icon: 'fa-solid fa-download',
        command: () => downloadFile(useCurrentSchema().schemaRaw.value.title ?? 'file', false),
      },
      {
        separator: true,
      },
      {
        label: 'Undo',
        icon: 'fa-solid fa-rotate-left',
        key: 'undo',
        command: () => {
          useCurrentData().undoManager.undo();
        },
        disabled: () => !useCurrentData().undoManager.canUndo.value,
      },
      {
        label: 'Redo',
        icon: 'fa-solid fa-rotate-right',
        command: () => {
          useCurrentData().undoManager.redo();
        },
        disabled: () => !useCurrentData().undoManager.canRedo.value,
        key: 'redo',
      },
      {
        separator: true,
      },
    ];

    result.push(...this.generateModeSpecificPanelToggleButtons(SessionMode.DataEditor, settings));

    return result;
  }

  public getSchemaEditorMenuItems(settings: SettingsInterfaceRoot): MenuItem[] {
    let result: MenuItem[] = [
      {
        label: 'New empty Schema',
        icon: 'fa-regular fa-file',
        items: [
          {
            label: 'New empty Schema',
            icon: 'fa-regular fa-file',
            command: clearCurrentFile,
          },
          {
            label: 'Infer Schema from Data',
            icon: 'fa-solid fa-wand-magic-sparkles',
            command: this.inferJsonSchemaFromSampleData,
          },
        ],
      },
      {
        label: 'Open Schema',
        icon: 'fa-regular fa-folder-open',
        items: [
          {
            label: 'From File',
            icon: 'fa-regular fa-folder-open',
            command: openUploadSchemaDialog,
          },

          {
            label: 'From JSON Schema Store',
            icon: 'fa-solid fa-database',
            command: this.onFromWebClick,
          },
          {
            label: 'From URL',
            icon: 'fa-solid fa-globe',
            command: this.handleFromURLClick,
          },
          {
            label: 'Example Schemas',
            icon: 'fa-solid fa-database',
            command: this.onFromOurExampleClick,
          },
        ],
      },
      {
        label: 'Download Schema',
        icon: 'fa-solid fa-download',
        command: () => downloadFile(useDataSource().userSchemaData.value.title ?? 'untitled', true),
      },
      {
        separator: true,
      },
      {
        label: 'Undo',
        icon: 'fa-solid fa-rotate-left',
        command: () => {
          useCurrentData().undoManager.undo();
        },
        disabled: () => !useCurrentData().undoManager.canUndo.value,
        key: 'schema_undo',
      },
      {
        label: 'Redo',
        icon: 'fa-solid fa-rotate-right',
        command: () => {
          useCurrentData().undoManager.redo();
        },
        disabled: () => !useCurrentData().undoManager.canRedo.value,
        key: 'schema_redo',
      },
      {
        separator: true,
      },
    ];

    result.push(...this.generateModeSpecificPanelToggleButtons(SessionMode.SchemaEditor, settings));

    // toggle between showing and hiding the GUI preview
    result.push(
      this.generateTogglePanelButton(
        SessionMode.SchemaEditor,
        panelTypeGuiEditor.name,
        SessionMode.DataEditor,
        'fa-regular fa-eye',
        'fa-solid fa-eye',
        'preview of resulting GUI',
        settings
      )
    );

    result.push({
      separator: true,
    });

    // toggle between advanced and simple schema options
    result.push(
      this.generateToggleButton(
        () =>
          settings.metaSchema.allowBooleanSchema &&
          settings.metaSchema.allowMultipleTypes &&
          !settings.metaSchema.objectTypesComfort &&
          !settings.metaSchema.markMoreFieldsAsAdvanced,
        () => {
          const metaSchema = settings.metaSchema;
          metaSchema.allowBooleanSchema = true;
          metaSchema.allowMultipleTypes = true;
          metaSchema.objectTypesComfort = false;
          metaSchema.markMoreFieldsAsAdvanced = false;
        },
        () => {
          const metaSchema = settings.metaSchema;
          metaSchema.allowBooleanSchema = false;
          metaSchema.allowMultipleTypes = false;
          metaSchema.markMoreFieldsAsAdvanced = true;
        },
        'fa-solid fa-gear',
        'fa-solid fa-gear',
        'Enable advanced schema options',
        'Disable advanced schema options'
      )
    );

    // toggle to activate/deactivate JSON-LD support
    result.push(
      this.generateToggleButton(
        () => settings.metaSchema.showJsonLdFields,
        () => {
          const metaSchema = settings.metaSchema;
          metaSchema.showJsonLdFields = true;
        },
        () => {
          const metaSchema = settings.metaSchema;
          metaSchema.showJsonLdFields = false;
        },
        'fa-solid fa-circle-nodes',
        'fa-solid fa-circle-nodes',
        'Enable JSON-LD fields\n(You can specify the SPARQL endpoint in the settings)',
        'Disable JSON-LD fields'
      )
    );

    return result;
  }

  public getSettingsMenuItems(settings: SettingsInterfaceRoot): MenuItem[] {
    let result: MenuItem[] = [
      {
        label: 'Open settings file',
        icon: 'fa-regular fa-folder-open',
        command: () => {
          throw new Error('Not implemented yet');
        },
        disabled: true,
      },
      {
        label: 'Save settings file',
        icon: 'fa-regular fa-floppy-disk',
        command: () => downloadFile('metaConfiguratorSettings', false),
      },
      {
        separator: true,
      },
      {
        label: 'Undo',
        icon: 'fa-solid fa-rotate-left',
        command: () => {
          useCurrentData().undoManager.undo();
        },
        disabled: () => !useCurrentData().undoManager.canUndo.value,
        key: 'settings_undo',
      },
      {
        label: 'Redo',
        icon: 'fa-solid fa-rotate-right',
        command: () => {
          useCurrentData().undoManager.redo();
        },
        disabled: () => !useCurrentData().undoManager.canRedo.value,
        key: 'settings_redo',
      },
      {
        separator: true,
      },
      {
        label: 'Restore default settings',
        icon: 'fa-solid fa-trash-arrow-up',
        command: () => {
          getDataForMode(SessionMode.Settings).setData(structuredClone(SETTINGS_DATA_DEFAULT));
        },
        key: 'settings_restore',
      },
      {
        label: 'Create sharable snapshot',
        icon: 'fa-solid fa-file-export',
        command: this.showSnapshotDialog,
        key: 'snapshot',
      },
      {
        separator: true,
      },
    ];

    result.push(...this.generateModeSpecificPanelToggleButtons(SessionMode.Settings, settings));

    return result;
  }

  private generateModeSpecificPanelToggleButtons(
    mode: SessionMode,
    settings: SettingsInterfaceRoot
  ): MenuItem[] {
    let result: MenuItem[] = [];

    for (const panelTypeName of panelTypeRegistry.getPanelTypeNames()) {
      const panelTypeDefinition = panelTypeRegistry.getPanelTypeDefinition(panelTypeName);
      if (panelTypeDefinition.supportedModes.includes(mode)) {
        // toggle between showing and hiding the panel
        result.push(
          this.generateTogglePanelButton(
            mode,
            panelTypeName,
            mode,
            panelTypeDefinition.icon,
            panelTypeDefinition.icon,
            panelTypeDefinition.label,
            settings
          )
        );
      }
    }

    return result;
  }

  private generateTogglePanelButton(
    buttonMode: SessionMode,
    panelTypeName: string,
    panelMode: SessionMode,
    iconNameEnabled: string,
    iconNameDisabled: string,
    description: string,
    settings: SettingsInterfaceRoot
  ): MenuItem {
    return this.generateToggleButton(
      () =>
        settings.panels[buttonMode].find(
          panel => panel.panelType === panelTypeName && panel.mode === panelMode
        ) !== undefined,
      () => {
        const panels = settings.panels;
        panels[buttonMode].push({
          panelType: panelTypeName,
          mode: panelMode,
          size: 40,
        });
      },
      () => {
        const panels = settings.panels;
        panels[buttonMode] = panels[buttonMode].filter(
          panel => !(panel.panelType === panelTypeName && panel.mode === panelMode)
        );
      },
      iconNameEnabled,
      iconNameDisabled,
      `Show ${description}`,
      `Hide ${description}`
    );
  }

  private generateToggleButton(
    conditionActive: () => boolean,
    actionActivate: () => void,
    actionDeactivate: () => void,
    iconNameEnabled: string,
    iconNameDisabled: string,
    descriptionActivate: string,
    descriptionDeactivate: string
  ): MenuItem {
    if (conditionActive()) {
      return {
        label: descriptionDeactivate,
        icon: iconNameDisabled,
        highlighted: true,
        command: actionDeactivate,
      };
    } else {
      return {
        label: descriptionActivate,
        icon: iconNameEnabled,
        command: actionActivate,
      };
    }
  }
}
