import Token from 'markdown-it/lib/token';
import * as vscode from 'vscode';
import { FoamGraph } from '../../core/model/graph';
import { FoamWorkspace } from '../../core/model/workspace';
import { toVsCodeUri } from '../../utils/vsc-utils';

function createDivNodeOpening(className: string): Token {
  const token = new Token('backlink-open', 'div', 1);
  token.block = true;
  token.attrSet('class', className);
  token.level = 1;
  return token;
}
function createDivNodeClosing(): Token {
  const token = new Token('backlink-close', 'div', -1);
  token.block = true;
  token.level = 1;
  return token;
}

function createHeader(text: string, headingLevel = 2): Token[] {
  const headingId = 'backlind';
  const tokens = [];
  let token: Token;

  token = new Token('heading_open', `h${headingLevel}`, 1);
  token.attrSet('id', headingId);
  token.markup = '#'.repeat(headingLevel);
  token.block = true;
  token.level = 0;
  tokens.push(token);

  const tokenChild = new Token('text', '', 0);
  tokenChild.level = 0;
  tokenChild.content = text;

  token = new Token('inline', '', 0);
  token.level = 1;
  token.content = text;
  token.children = [tokenChild];
  tokens.push(token);

  token = new Token('heading_close', `h${headingLevel}`, -1);
  token.markup = '#'.repeat(headingLevel);
  token.block = true;
  token.level = 0;
  tokens.push(token);

  return tokens;
}

function createParagraph(text: string, level: number): Token[] {
  const tokens: Token[] = [];
  let token: Token;

  token = new Token('paragraph_open', 'p', 1);
  token.level = level++;
  token.block = true;
  tokens.push(token);

  token = new Token('inline', '', 0);
  token.level = level;
  token.block = false;
  token.content = text;
  token.children = [];

  const tokenChild = new Token('text', '', 0);
  tokenChild.content = text;
  token.children.push(tokenChild);
  tokens.push(token);

  token = new Token('paragraph_close', 'p', -1);
  token.level = --level;
  token.block = true;
  tokens.push(token);

  return tokens;
}

// function createPre(text: string, level: number): Token[] {
//   const tokens: Token[] = [];
//   let token: Token;

//   token = new Token('paragraph_open', 'pre', 1);
//   token.level = level++;
//   token.block = true;
//   tokens.push(token);

//   token = new Token('inline', '', 0);
//   token.level = level;
//   token.block = false;
//   token.content = text;
//   token.children = [];

//   const tokenChild = new Token('text', '', 0);
//   tokenChild.content = text;
//   token.children.push(tokenChild);
//   tokens.push(token);

//   token = new Token('paragraph_close', 'pre', -1);
//   token.level = --level;
//   token.block = true;
//   tokens.push(token);

//   return tokens;
// }

function createBlockQuote(snippet: string, level: number): Token[] {
  const tokens: Token[] = [];
  let token: Token;

  token = new Token('blockquote_open', 'div', 1);
  token.markup = '>';
  token.level = level++;
  token.block = false;
  token.attrSet('class', 'foam-blockquote');
  tokens.push(token);

  // tokens.push(...createPre(snippet, level));
  token = new Token('fence', 'code', 0);
  token.level = level;
  token.block = false;
  token.content = snippet;
  tokens.push(token);

  token = new Token('blockquote_close', 'div', -1);
  token.level = --level;
  token.block = false;
  tokens.push(token);

  return tokens;
}

function createBackLinkListItem(
  text: string,
  snippet: string,
  link: string
): Token[] {
  const tokens: Token[] = [];
  const block = false;
  let level = 0;

  let token: Token;

  token = new Token('list_item_open', 'div', 1);
  token.attrSet('class', 'foam-back-link-item');
  token.level = level++;
  token.block = block;
  tokens.push(token);

  token = new Token('link_open', 'a', 1);
  token.level = level++;
  token.attrSet('href', link);
  tokens.push(token);

  tokens.push(...createParagraph(text, level));

  tokens.push(...createBlockQuote(snippet, level));

  token = new Token('link_close', 'a', -1);
  token.level = --level;
  tokens.push(token);

  token = new Token('list_item_close', 'div', -1);
  token.level = --level;
  token.block = block;
  tokens.push(token);

  return tokens;
}

function guessPath(line: string, workspace: FoamWorkspace): string {
  const fields = line.split(' ', 3);
  if (fields.length < 2) {
    return '';
  }
  const res = workspace.find(fields[1]);

  if (!res) {
    return '';
  }

  return res.uri.path;
}

export const markdownBacklink = (
  md: markdownit,
  workspace: FoamWorkspace,
  formGraph: FoamGraph
) => {
  md.core.ruler.before('smartquotes', 'backlink-summary', state => {
    const uri = guessPath(state.src.split('\n', 2)[0], workspace);

    console.log('get name = ' + uri);
    if (!uri) {
      return;
    }

    const backlinks = formGraph.backlinks.get(uri);
    if (!backlinks || backlinks.length === 0) {
      return;
    }

    const tokens = state.tokens;
    tokens.push(...createHeader('BackLinks'));

    // tokens.push(createListOpening());

    const seen: Set<string> = new Set();
    tokens.push(createDivNodeOpening('foam-back-link-item-container'));
    for (const backlink of backlinks) {
      const srcpath = backlink.source.path;
      if (seen.has(srcpath)) {
        continue;
      }
      const name = workspace.getIdentifier(backlink.source);
      const title = workspace.find(backlink.source).title;

      const link = vscode.workspace.asRelativePath(
        toVsCodeUri(backlink.source),
        false
      );
      tokens.push(...createBackLinkListItem(name, title, '/' + link));
    }
    tokens.push(createDivNodeClosing());
    return true;
  });
  return md;
};

export function markdownBacklinkFactory(formGraph: FoamGraph) {
  return (md: markdownit, workspace: FoamWorkspace) => {
    return markdownBacklink(md, workspace, formGraph);
  };
}

export default markdownBacklinkFactory;
