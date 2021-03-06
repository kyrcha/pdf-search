# pdf-search

The pdf-search web service acts as a wrapper on elastic search in order to help the search of text inside pdf documents.

You upload the pdf contents in base64 encoding and search using keywords on a REST API endpoint.

## Installation

From the root directory of the project.

**Step 1**

Run Elasticsearch using docker:

`docker run -d -name elasticsearch -p 9200:9200 -p 9300:9300 -v <hostdir>:/usr/share/elasticsearch/data -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.14.0`

**Step 2**

Create the elastic search index:

`node scripts/createTheIndex.js`

Be careful: This must be done once since in the beginning it drops and recreates the index.

You can also test the index:

`node scripts/testTheIndex.js`

**Step 3**

Run the service:

`npm start`

Note: this is for testing it and not for a production ready deployment with security features etc.

## API

**Search**: `GET /api/search?keywords=list of keywords separated by space`

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

- page (optional): the page number `GET /api/documents?page=10`

**Get document**: `GET /api/documents/:id`

**Delete document**: `DELETE /api/documents/:id`

## Use

You can test the app using a REST API client like Insomnia.

There is also a `pdf2base64.ps1` PowerShell script in the root of the project, to convert a pdf to its base64 equivalent.

## Dockerize

```
docker build -t pdf-search:latest .
docker tag pdf-search registry.sga.gr/pdf-search
docker push registry.sga.gr/pdf-search
```
