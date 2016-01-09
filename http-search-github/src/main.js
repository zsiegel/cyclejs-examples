import Cycle from '@cycle/core';
import {Observable} from 'rx';
import {div, p, label, input, hr, ul, li, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {

  const GITHUB_SEARCH_API = 'https://api.github.com/search/repositories?q=';

  // Requests for Github repositories happen when the input field changes, debounced by 500ms
  const repoQueryString$ = sources.DOM.select('.field').events('input')
      .debounce(500)
      .map(ev => ev.target.value);

  // We create a request when the query string is greater than 0 characters
  const searchRequest$ = repoQueryString$
      .filter(query => query.length > 0)
      .map(q => GITHUB_SEARCH_API + encodeURI(q));

  // Requests unrelated to the Github search. This is to demonstrate
  // how filtering for the correct HTTP responses is necessary.
  const otherRequest$ = Observable.interval(1000).take(2).map(() => 'http://www.google.com');

  // Convert the stream of HTTP responses to virtual DOM elements
  const searchResultTree = sources.HTTP
      // We are only interested in requests made to Github
      .filter(res$ => res$.request.url.indexOf(GITHUB_SEARCH_API) === 0)
      // We take the Observable doing the ajax request and transform it to do the following
      // 1) When a new request is made we send a message indicating that its loading
      // 2) We catch any errors that occur and emit that error - this allows for requests to complete after an error
      .flatMap(x => x.startWith({msg: 'Loading...'}).catch(err => Observable.just({err})))
      // We then merge any incoming requests with a blank request for when the input field has no characters
      // This is essentially our empty state
      .merge(repoQueryString$.filter(query => query.length == 0).map({results: [], msg: ''}))
      // Normalize the incoming object to an object containing the results and a status message
      // We only do this when the incoming object is not an error
      .map(isResult(({body, msg}) => {
        return {results: body ? body.items : [], msg: msg}
      }))
      // We start with an empty state when we first load the page
      .startWith({results: [], msg: ''})
      // Map the results into a chunk of DOM displaying a message and results
      .map(isResult(({results, msg}) =>
          div([
            p(msg),
            ul({className: 'search-results'}, results.map(result =>
                li({className: 'search-result'}, [
                  a({href: result.html_url}, result.name)
                ])
            ))
          ])))
      // Map the errors into a chunk of DOM displaying what went wrong
      .map(isErr(({err}) => div([
        p({className: 'error'}, 'Error : ' + err.message)
      ])));

  // Combine our requests to Github and Google
  const request$ = searchRequest$.merge(otherRequest$);

  return {
    DOM: searchResultTree.map(searchTree =>
        div([
          label({className: 'label'}, 'Search:'),
          input({className: 'field', attributes: {type: 'text'}}),
          hr(),
          searchTree
        ])),
    HTTP: request$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});

// helper functions
// source - https://github.com/killercup/cycle-webpack-starter/blob/master/app/helpers/map-errors.js
// These functions are used to help map different objects to the functions responsible for displaying/manipulating them

function isError(data) {
  return !!(data && data.err);
}

function identity(x) {
  return x;
}

// If the incoming object is not an error return the output of the mapper function - otherwise return the object
function isResult(mapper) {
  return (data) => isError(data) ? identity(data) : mapper(data);
}

// If the incoming object is an error return the output of the mapper function - otherwise return the object
function isErr(mapper) {
  return (data) => isError(data) ? mapper(data) : identity(data);
}