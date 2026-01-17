import { type Component as ComponentType, type Hashes, identifierInputSchema, type Subcomponent } from "../schemas.js";

export type SubcomponentInput = string | { id: string; hashes?: Hashes };

export class Component {
  readonly #data: Readonly<ComponentType>;

  private constructor(data: ComponentType) {
    this.#data = Object.freeze({ ...data });
  }

  static create(input: string | { id: string; hashes?: Hashes; subcomponents?: SubcomponentInput[] }): Component {
    const inputIsString = typeof input === "string";
    const identifier = inputIsString ? input : input.id;
    const base = identifierInputSchema.parse(identifier);
    const data: ComponentType = { ...base };
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

  private static buildSubcomponent(input: SubcomponentInput): Subcomponent {
    if (typeof input === "string") {
      return identifierInputSchema.parse(input);
    }
    const subcomponent: Subcomponent = { ...identifierInputSchema.parse(input.id) };
    if (input.hashes) {
      subcomponent.hashes = { ...input.hashes };
    }
    return subcomponent;
  }

  toData(): ComponentType {
    return structuredClone(this.#data);
  }
}
