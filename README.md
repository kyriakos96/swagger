# Swagger

This is a project that holds the implementation of one swagger instance.

## Prerequisites

1. Install nodejs on your machine
1. Install yarn
1. [Optional] Install Docker
1. [Optional] VScode Extensions:
   1. Swagger Viewer
   1. OpenApi (Swagger) Editor

## Starting

### Starting up for local development

```bash
# Install all the required modules by running
yarn
# Run/Start swagger
yarn start
```

### Starting up docker image

```bash
# Build Docker Image
docker build -t swagger .
# Run Docker image exposing port 3313
docker run -it -p 3313:3313 swagger
```

## Accessing Swagger

1. Access the definitions on <http://127.0.0.1:3013/api-docs/>
1. Call any of the available endpoints using `http://127.0.0.1:3013/ + {endpoint}`
1. Validations in place for Post:
   - payload holds all the required parameters - payload doesn't include additional parameters other than the ones defined in the schema

## Todo

1. Add to monorepo using lerna to incorporate multiple swagger projects.
