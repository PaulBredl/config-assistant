import type {Ref, ShallowRef, WritableComputedRef} from 'vue';
import {computed, ref, triggerRef} from 'vue';
import {useDataConverter} from '@/dataformats/formatRegistry';
import type {Path} from '@/utility/path';
import {dataAt} from '@/utility/resolveDataAtPath';
import {dataPathToSchemaPath, pathToString} from '@/utility/pathUtils';
import _ from 'lodash';
import {useDebouncedRefHistory} from '@vueuse/core';
import type {UndoManager} from '@/data/undoManager';
import type {SessionMode} from '@/store/sessionMode';
import {getSchemaForMode} from "@/data/useDataLink";

/**
 * This class manages the data and keeps the data and the string representation in sync.
 */
export class ManagedData {
  /**
   * @param shallowDataRef   the shallow ref to the data
   * @param mode the corresponding session mode. Useful to determine corresponding schema
   */
  constructor(public shallowDataRef: ShallowRef<any>, public mode: SessionMode) {
    this.data.value = shallowDataRef.value;
  }

  // variable that stores the string representation in the case that it could not be parsed
  // this is null if the string representation is valid
  private readonly unparseableDataString: Ref<string | null> = ref(null);

  private history: UndoManager | null = null;

  /**
   * The data. This is a computed property that keeps the data and the string representation in sync.
   */
  public readonly data: WritableComputedRef<any> = computed({
    get: () => {
      return this.shallowDataRef.value;
    },
    set: value => {
      this.shallowDataRef.value = value;
      this.unparseableDataString.value = null;
    },
  });

  /**
   * The string representation of the data. This is a computed property that keeps the data and the string
   * representation in sync.
   * In case the string representation can not be parsed, this property still contains the string
   * but the data will not be updated.
   */
  public readonly unparsedData: WritableComputedRef<string> = computed({
    get: () => {
      if (this.unparseableDataString.value !== null) {
        return this.unparseableDataString.value;
      }
      const {stringify} = useDataConverter();
      return stringify(this.shallowDataRef.value);
    },
    set: (value: string) => {
      const {parse} = useDataConverter();

      try {
        this.shallowDataRef.value = parse(value);
        this.unparseableDataString.value = null;
      } catch (e) {
        this.unparseableDataString.value = value;
      }
    },
  });

  /**
   * This function updates the data using the given updater function and triggers the shallow data ref.
   * This can be used to update sub properties of the data.
   *
   * @param updater the function that updates the data. If this function returns false, the shallow data ref
   *                will not be triggered. This can be used to prevent unnecessary updates.
   */
  public updateData(updater: (data: any) => boolean | void): void {
    const updated = updater(this.data.value);
    if (updated !== false) {
      triggerRef(this.shallowDataRef);
    }
  }

  /**
   * Sets the data at the given path to the given value.
   *
   * @param path  the path to the data
   * @param value the new value
   */
  public setDataAt(path: Path, value: any): void {
    if (path.length === 0) {
      // if the path is empty, we set the data directly
      this.setData(value);
      return;
    }

    const dataAtPath = this.dataAt(path);
    if (_.isEqual(dataAtPath, value)) {
      // nothing to do if the value is the same
      return;
    }

    if (dataAtPath == null) {
      // if the element is new, we add it to the parent object in a sorted way
      const parentPath = path.slice(0, path.length - 1);
      const parentSchemaPath = dataPathToSchemaPath(parentPath);
      const parentSchemaProps = getSchemaForMode(this.mode).effectiveSchemaAtPath(parentSchemaPath).schema.properties;
      const parentData = structuredClone(this.dataAt(parentPath));
      if (!_.isEmpty(parentSchemaProps) && !_.isEmpty(parentData)) {
        // only proceed with property sorting when parent schema and data are not empty
        // warning: this function only works for normal properties, not for composition, conditionals and other advanced features
        // for those advanced features, the new property will be added at the end of the object
        // TODO: implement sorting for advanced features. This will be more complicated and will require a lot of testing
        const schemaKeys = Object.keys(parentSchemaProps);
        const dataKeys = Object.keys(parentData);
        const newElementKey = path[path.length - 1];
        parentData[newElementKey] = value; // Add the new property

        // sort the document properties based on the order of schema properties
        const sortedProperties: { [key: string]: any } = {};
        schemaKeys.forEach((key) => {
          if (dataKeys.includes(key) || key === newElementKey) {
            sortedProperties[key] = parentData[key];
          }
        });
        // after adding properties from the schema in proper order, add the rest of the properties
        dataKeys.forEach((key) => {
            if (!schemaKeys.includes(key)) {
                sortedProperties[key] = parentData[key];
            }
        });

        this.setDataAt(parentPath, sortedProperties);
        return;
      }
    }

    this.updateData(data => {
      _.set(data, pathToString(path), value);
    });
  }

  /**
   * Removes the data at the given path.
   *
   * @param path the path to the data
   */
  public removeDataAt(path: Path): void {
    if (path.length === 0) {
      this.setData({});
      return;
    }
    this.updateData(data => {
      const parentData = dataAt(path.slice(0, -1), data);
      if (Array.isArray(parentData)) {
        const indexToRemove = path[path.length - 1] as number;

        if (parentData.length <= indexToRemove) {
          return false; // nothing to remove
        }

        parentData.splice(indexToRemove, 1);
        return true;
      }
      return _.unset(data, pathToString(path));
    });
  }

  /**
   * Sets the data to the given value.
   *
   * @param data the new data
   */
  public setData(data: any): void {
    this.data.value = data;
  }

  /**
   * Returns the data at the given path.
   *
   * @param path the path to the data
   */
  public dataAt(path: Path): any | undefined {
    return dataAt(path, this.data.value);
  }

  public get undoManager(): UndoManager {
    if (this.history === null) {
      this.history = useDebouncedRefHistory(this.unparsedData, {
        capacity: 150,
        debounce: 100,
      });
    }
    return this.history;
  }
}
