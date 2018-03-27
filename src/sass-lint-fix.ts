import { SlfRunOptions } from './typings.d';
import SlRule from './resolvers/typings/sass-lint-rule';

import Logger from './helpers/logger';
import resolve from './helpers/module-resolver';

const gonzales = require('gonzales-pe-sl');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const sassLint = require('sass-lint');
const slConfig = require('sass-lint/lib/config');
const slRules = require('sass-lint/lib/rules');

export default class SlAutoFix {
  _logger: Logger;
  _defaultOptions: any;

  constructor(defaultOptions: any) {
    this._logger = new Logger(defaultOptions.verbose);

    this._defaultOptions = {
      ...defaultOptions,
    };
  }

  get logger() {
    return this._logger;
  }

  set logger(logger) {
    this._logger = logger;
  }

  run({ onResolve } : SlfRunOptions) {
    if (typeof onResolve !== 'function') {
      throw new Error('onResolve must be provided');
    }
    glob(this._defaultOptions.files.include, {}, (_globError: string, files: any[]) => {
      if (_globError !== null) {
        this.logger.verbose('error', _globError);
        return;
      }
      files.forEach((filename: string) => {
        fs.readFile(filename, (_readError: string, file: any) => {
          if (_readError) {
            this.logger.verbose('error', _readError);
            return;
          }

          this.logger.verbose('process', filename);

          const ast = gonzales.parse(file.toString(), {
            syntax: path.extname(filename).substr(1),
          });

          const rules = slRules(slConfig());

          return rules
            .filter((rule: SlRule) => !!this._defaultOptions.resolvers[rule.rule.name])
            .map((rule: SlRule) => resolve(`${rule.rule.name}`)
              .then((Module) => {
                const detects = rule.rule.detect(ast, rule);
                this.logger.verbose(`${filename} - detect`, Module.name, '-', detects.length);

                if (detects.length > 0) {
                  const resolver = new Module(ast, rule);
                  this.logger.verbose('--fix', `Running [${rule.rule.name}] on ${filename}`);

                  const resolvedTree = resolver.fix();
                  return onResolve.call(this, filename, rule, resolvedTree);
                }
                return null;
              }));
        });
      });
    });
  }
}
