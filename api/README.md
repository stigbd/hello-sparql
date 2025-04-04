# api

Usage:

```zsh
% curl -i http://localhost:8000/sparql \
--data-urlencode "data=`cat data.ttl`" \
--data-urlencode "query=`cat query.txt`"
```
