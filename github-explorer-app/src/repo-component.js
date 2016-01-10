/** @jsx hJSX */
import Cycle from '@cycle/core';
import {Observable} from 'rx';
import {hJSX} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {isResult, isErr} from './utils'

const REPO_API = 'https://api.github.com/repositories';
const LOADING = {msg: 'Loading...', results: []};

function intent(DOM) {

  const click$ = DOM.select('.refresh').events('click').map(ev => ev.target.value);

  return {
    refreshClick$: click$,
    request$: click$.map(ev => REPO_API).startWith(REPO_API),
  }
}

function model(actions, HTTP) {

  const response$ = HTTP
      .filter(res$ => res$.request.url === REPO_API)
      .flatMap(x => x.catch(err => Observable.just({err})));

  return response$.map(isResult(res => {
        return {msg: '', results: res.body};
      }))
      .merge(actions.refreshClick$.map(LOADING))
      .startWith(LOADING);
}

function view(state$) {

  const refreshButton$ = Observable.just(renderButton());

  const results$ = state$
      .map(isResult(({msg, results}) => renderResults(msg, results)))
      .map(isErr(({err}) => <p>{err.message}</p>));

  return Observable.combineLatest(refreshButton$, results$, (button, results) => {
    return <div>{button}{results}</div>;
  });
}

function renderResults(msg, results) {
  return <div>
    {msg.length > 0 ? <div className="message">{msg}</div> : null}
    <ul className="results">
      {results.map(obj => <li id={obj.id} className="repo-name">{obj.name}</li>)}
    </ul>
  </div>
}

function renderButton() {
  return <div>
    <button className="refresh">Refresh</button>
  </div>;
}

function RepoComponent(sources) {

  const actions = intent(sources.DOM);
  const state$ = model(actions, sources.HTTP);
  const vtree$ = view(state$);

  return {
    DOM: vtree$,
    HTTP: actions.request$
  }
}

export default RepoComponent