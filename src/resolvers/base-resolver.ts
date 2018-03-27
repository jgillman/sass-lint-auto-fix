import Resolver from './typings/resolver';
import AbstractSyntaxTree from './typings/abstract-syntax-tree';
import SlRule from './typings/sass-lint-rule';

export default class BaseResolver implements Resolver {
  private _ast: AbstractSyntaxTree;
  private _parser: SlRule;

  constructor(ast: AbstractSyntaxTree, parser: SlRule) {
    this._ast = ast;
    this._parser = parser;
  }

  fix(): AbstractSyntaxTree {
    throw new Error('Must be implemented');
  }

  get ast() {
    return this._ast;
  }

  get parser() {
    return this._parser;
  }
}
