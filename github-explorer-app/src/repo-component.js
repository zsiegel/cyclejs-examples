/** @jsx hJSX */
import Cycle from '@cycle/core';
import {Observable} from 'rx';
import {hJSX} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';
import {isResult, isErr} from './utils'

const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories?q=';
const LOADING = {msg: 'Loading...', results: []};
const EMPTY = {msg: '', results: []};

function intent(DOM) {

  const inputFieldChange$ = DOM.select('.search-field').events('input')
      .debounce(500)
      .map(ev => ev.target.value);

  const searchRequest$ = inputFieldChange$
      .filter(query => query.length > 0)
      .map(q => GITHUB_SEARCH_API + encodeURI(q));

  return {
    queryChange$: inputFieldChange$,
    request$: searchRequest$
  }
}

function model(actions, HTTP) {

  const response$ = HTTP
      .filter(res$ => res$.request.url.indexOf(GITHUB_SEARCH_API) === 0)
      .flatMap(x => x.startWith(LOADING).catch(err => Observable.just({err})))
      //When the query input is 0 characters we clear results
      .merge(actions.queryChange$.filter(query => query.length == 0).map(EMPTY))
      .map(isResult(({body, results, msg}) => {

        //If we got a response and there are no results then set a 'no results' message
        if (body && body.items.length == 0) {
          msg = 'No Results';
        }
        return {results: body ? body.items : results, msg: msg || ''}
      }))
      .startWith(EMPTY);

  return response$;
}

function view(state$) {

  const refreshButton$ = Observable.just(renderInputField());

  const results$ = state$
      .map(isResult(({msg, results}) => renderResults(msg, results)))
      .map(isErr(({err}) => renderError(err)));

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

function renderError(err) {
  return <p>{err.message}</p>;
}

function renderInputField() {
  return <div>
    <label className="label">Search</label>
    <input type="text" className="search-field"/>
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