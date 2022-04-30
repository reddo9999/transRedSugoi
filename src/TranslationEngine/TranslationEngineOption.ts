import type { TranslationEngineWrapper } from './TranslationEngineWrapper';

export class TranslationEngineOption<T> {
	private options: {
		id: string;
		wrapper: TranslationEngineWrapper;
		category: string;
		priority: number;
		name: string;
		description: string;
		default: T;
		type: string;
		formType?: string;
		schemaOptions: { [id: string]: any };
		formOptions: { [id: string]: any };
	};
	private value: T | undefined;

	constructor(options: {
		id: string;
		wrapper: TranslationEngineWrapper;
		name: string;
		description: string;
		category: string;
		priority?: number;
		default: T;
		formType?: string;
		schemaOptions?: { [id: string]: any };
		formOptions?: { [id: string]: any };
	}) {
		this.options = Object.assign(
			{
				priority: 0,
				type: typeof options.default,
				formOptions: {},
				schemaOptions: {}
			},
			options
		);

		this.options.wrapper.addOption(this);
	}

	public getCategory(): string {
		return this.options.category;
	}

	public getPriority() {
		return this.options.priority;
	}

	public getDescription() {
		return this.options.description;
	}

	public getName() {
		return this.options.name;
	}

	public getId() {
		return this.options.id;
	}

	public getValue(): T {
		if (this.getType() == 'boolean') {
			// @ts-expect-error
			return this.value === '1' || this.value === 'true';
		}
		this.value = this.options.wrapper.getEngine().getOptions(this.options.id);
		if (this.value === undefined) {
			this.value = this.options.default;
		}
		return this.value;
	}

	public setValue(value: T) {
		if (typeof value == 'string') {
			if (this.getType() == 'boolean') {
				value = <T>(<any>(value === '1' || value === 'true' || (<any> value) === true));
			} else if (this.getType() == 'number') {
				// @ts-expect-error - A lazy fix
				value = Number(value);
			} else if (this.getType() == 'object') {
				try {
					value = JSON.parse(value);
				} catch (e) {
					console.error(e);
					return;
				}
			}
		}
		this.options.wrapper.getEngine().update(this.options.id, value);
	}

	public getType() {
		return this.options.type;
	}

	public getDefault(): T {
		return this.options.default;
	}

	public getFormType() {
		return this.options.formType;
	}

	public getFormOptions() {
		return this.options.formOptions;
	}

	public getSchemaOptions() {
		return this.options.schemaOptions;
	}
}
