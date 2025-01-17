import * as vscode from 'vscode';
import { FoamFeature } from '../../types';
import { Foam } from '../../core/model/foam';
import { default as markdownItFoamTags } from './tag-highlight';
import { default as markdownItWikilinkNavigation } from './wikilink-navigation';
import { default as markdownItRemoveLinkReferences } from './remove-wikilink-references';
import { default as markdownItWikilinkEmbed } from './wikilink-embed';
import { default as markdownItShortLink } from './xzr-shortlink';
import { default as markdownBacklinkFactory } from './xzr-backlink';

const feature: FoamFeature = {
  activate: async (
    _context: vscode.ExtensionContext,
    foamPromise: Promise<Foam>
  ) => {
    const foam = await foamPromise;

    return {
      extendMarkdownIt: (md: markdownit) => {
        return [
          markdownItWikilinkEmbed,
          markdownItFoamTags,
          markdownItWikilinkNavigation,
          markdownItRemoveLinkReferences,
          markdownItShortLink,
          markdownBacklinkFactory(foam.graph),
        ].reduce((acc, extension) => extension(acc, foam.workspace), md);
      },
    };
  },
};
export default feature;
