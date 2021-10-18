# pdf-search

## API

Run Elasticsearch using docker:

`docker run -d -name elasticsearch -p 9200:9200 -p 9300:9300 -v <hostdir>:/usr/share/elasticsearch/data -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.14.0`

Run the service:

`npm start`
