/** @jsx hJSX */
import Cycle from '@cycle/core';
import {Observable} from 'rx';
import {makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import RepoComponent from './repo-component.js';

function main(sources) {
  const repoComponent = RepoComponent(sources);
  return {
    DOM: repoComponent.DOM,
    HTTP: repoComponent.HTTP
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});