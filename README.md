# pdf-search

## Installation

Run Elasticsearch using docker:

`docker run -d -name elasticsearch -p 9200:9200 -p 9300:9300 -v <hostdir>:/usr/share/elasticsearch/data -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.14.0`

Run the service:

`npm start`

## API

**Search**: `GET /api/search?keyworks=list of keywords separated by space`

**Upload document**: `POST /api/upload` with body:

```
{
  id: <the id of the document in the main app>,
  filename: <the name of the file>,
  file: <base64 version of the contents of the file>
}
```

If OK the response will be `201` created.
If there was an error:

- `400` client error with a message
- `500` server error, check the logs

**Get all documents**: `GET /api/documents`

Query params:

- page: the page number `GET /api/documents?page=10`

**Get document**: `GET /api/documents/:id`

**Delete document**: `DELETE /api/documents/:id`
