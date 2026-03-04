import type { QueryTemplate } from '@rdf-explorer/types';

export const QUERY_TEMPLATES: Record<string, QueryTemplate> = {
  select: {
    type: 'select',
    label: 'Select Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org#>

SELECT ?s ?p ?o
WHERE {
    ?s ?p ?o .
}`,
  },
  count: {
    type: 'select',
    label: 'Count Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org#>

SELECT (COUNT(*) AS ?count)
WHERE {
    ?s ?p ?o .
}`,
  },
  ask: {
    type: 'ask',
    label: 'Ask Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org#>

ASK
WHERE
{
    ?s ?p ?o .
}`,
  },
  describe: {
    type: 'describe',
    label: 'Describe Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org#>

DESCRIBE ?s ?p ?o
WHERE {
    ?s ?p ?o .
}`,
  },
  construct: {
    type: 'construct',
    label: 'Construct Query',
    query: `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX ex: <http://example.org#>

CONSTRUCT {
    ?s ?p ?o .
}
WHERE {
    ?s ?p ?o .
}`,
  },
};

export const INITIAL_DATA = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org#>.

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

export const SHACL_TEMPLATES: Record<string, { label: string; shapes: string }> = {
  basic: {
    label: 'Basic Person Shape',
    shapes: `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org#>.

ex:PersonShape
    a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
    ] ;
    sh:property [
        sh:path ex:age ;
        sh:datatype xsd:integer ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:minInclusive 0 ;
        sh:maxInclusive 150 ;
    ] .`,
  },
  advanced: {
    label: 'Advanced Person Shape',
    shapes: `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org#>.

ex:PersonShape
    a sh:NodeShape ;
    sh:targetClass ex:Person ;
    sh:property [
        sh:path ex:name ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:minLength 1 ;
        sh:maxLength 100 ;
    ] ;
    sh:property [
        sh:path ex:age ;
        sh:datatype xsd:integer ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:minInclusive 0 ;
        sh:maxInclusive 150 ;
    ] ;
    sh:property [
        sh:path ex:email ;
        sh:datatype xsd:string ;
        sh:maxCount 1 ;
        sh:pattern "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$" ;
    ] .`,
  },
  custom: {
    label: 'Custom Shape',
    shapes: `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.
@prefix ex: <http://example.org#>.

# Define your SHACL shapes here`,
  },
};

export const DEFAULT_SHACL_SHAPES = SHACL_TEMPLATES.basic.shapes;
