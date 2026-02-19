import { type ComponentData, type Hashes, identifierInputSchema, type SubcomponentData } from "../schemas.js";
import { deepFreeze } from "../utils.js";

export type SubcomponentInput = string | { id: string; hashes?: Hashes };

export class Component {
  readonly #data: Readonly<ComponentData>;

  private constructor(data: ComponentData) {
    this.#data = deepFreeze({ ...data });
  }

  static create(input: string | { id: string; hashes?: Hashes; subcomponents?: SubcomponentInput[] }): Component {
    const inputIsString = typeof input === "string";
    const identifier = inputIsString ? input : input.id;
    const base = identifierInputSchema.parse(identifier);
    const data: ComponentData = { ...base };
    if (!inputIsString) {
      if (input.hashes) {
        data.hashes = { ...input.hashes };
      }
      if (input.subcomponents?.length) {
        data.subcomponents = input.subcomponents.map(Component.buildSubcomponent);
      }
    }
    return new Component(data);
  }

  private static buildSubcomponent(input: SubcomponentInput): SubcomponentData {
    if (typeof input === "string") {
      return identifierInputSchema.parse(input);
    }
    const subcomponent: SubcomponentData = { ...identifierInputSchema.parse(input.id) };
    if (input.hashes) {
      subcomponent.hashes = { ...input.hashes };
    }
    return subcomponent;
  }

  toJSON(): ComponentData {
    return structuredClone(this.#data);
  }
}
