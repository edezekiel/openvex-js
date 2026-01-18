import { type Component, type Hashes, identifierInputSchema, type Subcomponent } from "../schemas.js";

export type SubcomponentInput = string | { id: string; hashes?: Hashes };

export class ComponentBuilder {
  readonly #data: Readonly<Component>;

  private constructor(data: Component) {
    this.#data = Object.freeze({ ...data });
  }

  static create(
    input: string | { id: string; hashes?: Hashes; subcomponents?: SubcomponentInput[] },
  ): ComponentBuilder {
    const inputIsString = typeof input === "string";
    const identifier = inputIsString ? input : input.id;
    const base = identifierInputSchema.parse(identifier);
    const data: Component = { ...base };
    if (!inputIsString) {
      if (input.hashes) {
        data.hashes = { ...input.hashes };
      }
      if (input.subcomponents?.length) {
        data.subcomponents = input.subcomponents.map(ComponentBuilder.buildSubcomponent);
      }
    }
    return new ComponentBuilder(data);
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

  toData(): Component {
    return structuredClone(this.#data);
  }
}
