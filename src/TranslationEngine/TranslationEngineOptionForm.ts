import type { TranslationEngineOption } from './TranslationEngineOption';

const ace: AceAjax.Ace = require(// Go down to package.json
'../../../' +
	// Go down to trans++ main folder
	'../../' +
	// Enter into Ace folder
	'www/modules/ace/src-min-noconflict/' +
	// Get that ace!
	'ace.js');

// @ts-ignore
ace.config.set(
	'basePath', // Go down to package.json
	'../../../' +
		// Go down to trans++ main folder
		'../../' +
		// Enter into Ace folder
		'www/modules/ace/src-min-noconflict/'
);

export enum TranslationEngineOptionFormType {
	CHECKBOX,
	TEXTAREA,
	TEXTINPUT,
	SELECT,
	PATTERN
}

export type TranslationEngineOptionFormLineDefinition = {
	columns: Array<{
		/**
		 * Title is used as a label
		 */
		title: string;
		option: TranslationEngineOption<any>;
		type: TranslationEngineOptionFormType;

		/**
		 * Description will be printed below
		 */
		description: string;

		/**
		 * Only used for TEXTAREA
		 */
		height?: number;

		/**
		 * Changes flex-grow if provided. Only effective on lines with more than one column.
		 */
		width?: number;

		/**
		 * REQUIRED for SELECT
		 */
		selectValues?: Array<{
			innerText: string;
			value: string;
		}>;
	}>;
	/**
	 * Higher appears first
	 */
	priority: number;
};

/**
 * Goal:
 * - Make it easy to add simple form elements
 * - Make it *possible* to add complex form elements
 */
export class TranslationEngineOptionForm {
	protected options: {
		[category: string]: {
			lines: Array<TranslationEngineOptionFormLineDefinition>;
			orderBy?: (
				a: TranslationEngineOptionFormLineDefinition,
				b: TranslationEngineOptionFormLineDefinition
			) => number;
		};
	} = {};
	protected categories: Array<string> = [];

	public addCategory(
		name: string,
		orderType?: (
			a: TranslationEngineOptionFormLineDefinition,
			b: TranslationEngineOptionFormLineDefinition
		) => number
	) {
		if (this.options[name] === undefined) {
			this.options[name] = {
				lines: [],
				orderBy: orderType
			};
			this.categories.push(name);
		} else if (orderType !== undefined) {
			this.options[name].orderBy = orderType;
		}
	}

	public addLine(category: string, line: TranslationEngineOptionFormLineDefinition) {
		this.addCategory(category);
		this.options[category].lines.push(line);
	}

	public getForm(categorySorter?: (a: string, b: string) => number) {
		this.categories.sort(categorySorter);

		let form = document.createElement('div'); // not a real form!

		this.categories.forEach((category) => {
			let categoryTitle = document.createElement('h3');
			categoryTitle.appendChild(document.createTextNode(category));
			categoryTitle.style.margin = '0px';
			form.appendChild(categoryTitle);

			let lines = this.options[category].lines;
			lines.sort(this.options[category].orderBy);

			lines.forEach((line) => {
				form.appendChild(this.createColumn(line));
				let weakHR = document.createElement('hr');
				weakHR.style.borderTop = '1px dashed #0000001f';
				form.appendChild(weakHR);
			});

			let strongHR = document.createElement('hr');
			strongHR.style.borderTop = '2px double #000';
			form.appendChild(strongHR);
		});

		return form;
	}

	protected createColumn(line: TranslationEngineOptionFormLineDefinition) {
		let flexContainer = document.createElement('div');
		flexContainer.classList.add('controls');
		flexContainer.style.cssText = `
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-content: flex-start;
            align-items: flex-start;
            position: relative;
        `;

		line.columns.forEach((column) => {
			let columnContainer = document.createElement('div');
			columnContainer.style.cssText = `
                order: 0;
                flex: ${column.width !== undefined ? column.width : 1} 1 auto;
                flex-basis: 0;
                padding: 5px;
                box-sizing: border-box;
            `;
			let label = document.createElement('label');
			columnContainer.appendChild(label);
			let title = document.createElement('h5');
			title.style.margin = '0px';
			title.appendChild(document.createTextNode(column.title));
			let description = document.createElement('div');
			description.appendChild(document.createTextNode(column.description));
			description.style.cssText = `font-size: 85%; text-align: justify; padding-top: 5px;`;
			let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
			switch (column.type) {
				case TranslationEngineOptionFormType.CHECKBOX:
					columnContainer.classList.add('checkbox');
					input = <HTMLInputElement>document.createElement('input');
					input.type = 'checkbox';
					input.style.margin = '0px';
					input.checked = <boolean>column.option.getValue();
					title.appendChild(input);
					title.style.lineHeight = '26px';
					label.appendChild(title);
					label.appendChild(description);
					input.addEventListener('change', () => {
						column.option.setValue((<HTMLInputElement>input).checked);
					});
					break;
				case TranslationEngineOptionFormType.TEXTINPUT:
					input = <HTMLInputElement>document.createElement('input');
					input.style.width = '100%';
					input.value = column.option.getValue().toString();
					label.appendChild(title);
					label.appendChild(document.createElement('br'));
					label.appendChild(input);
					label.appendChild(document.createElement('br'));
					label.appendChild(description);
					input.addEventListener('change', () => {
						column.option.setValue((<HTMLInputElement>input).value);
					});
					break;
				case TranslationEngineOptionFormType.TEXTAREA:
					input = <HTMLTextAreaElement>document.createElement('textarea');
					input.style.width = '100%';
					input.value = column.option.getValue().toString();
					if (column.height !== undefined) {
						input.style.height = column.height + 'px';
					}
					label.appendChild(title);
					label.appendChild(document.createElement('br'));
					label.appendChild(input);
					label.appendChild(document.createElement('br'));
					label.appendChild(description);
					input.addEventListener('change', () => {
						column.option.setValue((<HTMLTextAreaElement>input).value);
					});
					break;
				case TranslationEngineOptionFormType.SELECT:
					let select = document.createElement('select');
					column.selectValues!.forEach((selectValue) => {
						let option = document.createElement('option');
						option.value = selectValue.value;
						option.appendChild(document.createTextNode(selectValue.innerText));
						select.appendChild(option);
					});
					label.appendChild(title);
					label.appendChild(document.createTextNode(': '));
					label.appendChild(select);
					select.addEventListener('change', () => {
						column.option.setValue((<HTMLSelectElement>select).value);
					});
					break;
				case TranslationEngineOptionFormType.PATTERN:
					label.appendChild(title);
					let aceEditorContainer = document.createElement('div');
					let editor = ace.edit(aceEditorContainer);
					editor.setTheme('ace/theme/monokai');
					editor.session.setMode('ace/mode/javascript');
					editor.setShowPrintMargin(false);
					editor.setOptions({
						fontSize: '12pt'
					});
					editor.on('blur', () => {
						column.option.setValue(editor.getValue());
					});
					editor.setValue(column.option.getValue());
					label.appendChild(aceEditorContainer);
					label.appendChild(document.createElement('br'));
					label.appendChild(description);
					break;
			}
			flexContainer.appendChild(columnContainer);
		});
		return flexContainer;
	}
}
