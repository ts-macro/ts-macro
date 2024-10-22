import { CodeMapping, forEachEmbeddedCode, LanguagePlugin, VirtualCode } from '@volar/language-core';
import type { TypeScriptExtraServiceScript } from '@volar/typescript';
import { URI } from 'vscode-uri';

export const getLanguagePlugin = (ts: typeof import('typescript')): LanguagePlugin<URI> => {
	return {
		getLanguageId() {
			return undefined;
		},
		createVirtualCode(_uri, languageId, snapshot) {
			if (['typescript', 'typescriptreact'].includes(languageId)) {
				return new TsmVirtualCode(snapshot, ts);
			}
		},
		typescript: {
			extraFileExtensions: [],
			getServiceScript() {
				return undefined;
			},
			getExtraServiceScripts(fileName, root) {
				const scripts: TypeScriptExtraServiceScript[] = [];
				for (const code of forEachEmbeddedCode(root)) {
					if (code.id === 'root') {
						scripts.push({
							fileName: fileName + '.' + code.id + '.tsx',
							code,
							extension: '.tsx',
							scriptKind: 4 satisfies import('typescript').ScriptKind.TSX,
						})
						break
					}
				}
				return scripts
			},
		},
	}
};

export class TsmVirtualCode implements VirtualCode {
	id = 'root';
	languageId = 'tsx';
	mappings: CodeMapping[];
	embeddedCodes: VirtualCode[] = [];

	sourceFile: import('typescript').SourceFile | undefined = undefined;

	constructor(public snapshot: import('typescript').IScriptSnapshot, public ts: typeof import('typescript')) {
		this.mappings = [{
			sourceOffsets: [0],
			generatedOffsets: [0],
			lengths: [snapshot.getLength()],
			data: {
				completion: true,
				format: true,
				navigation: true,
				semantic: true,
				structure: true,
				verification: true,
			},
		}];
		const sourceFile = ts.createSourceFile(
			'index.tsx',
			snapshot.getText(0, snapshot.getLength()),
			ts.ScriptTarget.Latest,
		);
		this.sourceFile = sourceFile
		if (this.sourceFile)
			this.embeddedCodes = [...this.getEmbeddedCodes(this.sourceFile)];
	}
	*getEmbeddedCodes(sourceFile: import('typescript').SourceFile): Generator<VirtualCode> {
		const styles: import('typescript').CallExpression[] = []
		const walk = (ast: import('typescript').Node) => {
			this.ts.forEachChild(ast, (node) => {
				if (
					this.ts.isCallExpression(node) &&
					(this.ts.isPropertyAccessExpression(node.expression) && this.ts.isIdentifier(node.expression.expression) ? node.expression.expression.text : this.ts.isIdentifier(node.expression) && node.expression.text) === ('defineStyle')
					&& this.ts.isTemplateLiteral(node.arguments[0])
				) {
					styles.push(node);
				}
				walk(node)
			})
		}
		walk(sourceFile)

		for (let i = 0; i < styles.length; i++) {
			const node = styles[i]
			const lang = this.ts.isPropertyAccessExpression(node.expression) && this.ts.isIdentifier(node.expression.name) ? node.expression.name.text : 'css';
			const style = node.arguments[0];
			const styleText = style.getText(this.sourceFile).slice(1, -1).replaceAll('${', ' {');

			yield {
				id: 'style_' + i,
				languageId: lang,
				snapshot: {
					getText: (start, end) => styleText.substring(start, end),
					getLength: () => styleText.length,
					getChangeRange: () => undefined,
				},
				mappings: [{
					sourceOffsets: [style.getStart(this.sourceFile)! + 1],
					generatedOffsets: [0],
					lengths: [styleText.length],
					data: {
						completion: true,
						format: true,
						navigation: true,
						semantic: true,
						structure: true,
						verification: true,
					},
				}],
				embeddedCodes: [],
			};
		}
	}

}
