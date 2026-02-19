import type { QueryTemplate } from '@hello-sparql/types';

export const QUERY_TEMPLATES: Record<string, QueryTemplate> = {
  select: {
    type: 'select',
    label: 'Basic Select',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT ?s ?p ?o
WHERE {
    ?s ?p ?o .
}`,
  },
  count: {
    type: 'count',
    label: 'Count Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

SELECT (COUNT(*) AS ?count)
WHERE {
    ?s ?p ?o .
}`,
  },
  construct: {
    type: 'construct',
    label: 'Basic Construct',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org/>

CONSTRUCT {
    ?s ?p ?o .
} WHERE {
    ?s ?p ?o .
}`,
  },
};

export const INITIAL_DATA = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org/>.

ex:John rdf:type ex:Person ;
        ex:name "John" ;
        ex:age 30 .

ex:Jane rdf:type ex:Person ;
        ex:name "Jane" ;
        ex:age 25 .

ex:Kitty rdf:type ex:Cat ;
        ex:name "Kitty" ;
        ex:age 7 .`;

export const DEFAULT_QUERY = QUERY_TEMPLATES.select.query;
