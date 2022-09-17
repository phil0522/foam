import markdownItRegex from 'markdown-it-regex';
import { FoamWorkspace } from '../../core/model/workspace';

export const markdownItShortLink = (
  md: markdownit,
  workspace: FoamWorkspace
) => {
  return md.use(markdownItRegex, {
    name: 'foam-shortlinks',
    regex: /((?<=(^|\s))(?:go|b|cl|google3)\/[-\w|/]{2,})/u,
    replace: (text: string) => {
      return `<a href="http://${text}" class="short-link">${text}</a>`;
    },
  });
};

export default markdownItShortLink;
