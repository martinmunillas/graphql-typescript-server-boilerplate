# Graphql-Typescript-Server-Boilerplate
A graphql api with typescript ready for you to clone it and have a fast launch

## Stack
Tyescript, Graphql, TypeORM, Postgres, Redis, Docker

### How to start!
  - Make a clone of this repository
  - CD into the folder of the project
  - Run ```docker-compose up -d```
  - Create a database with the name of your project
  - Go to your browser on localhost:3000 and enjoy
  
### How to develop
  - Run ```docker-compose up -d``` and run ```yarn watch``` at the same time
  - Edit the code and do whatever you want

##### Other commentaries:

 - To see the app logs run ```docker-compose logs -f```
 - If you are using the project with a development api in your localhost you should include dotenv in the project and run it directly and not with docker
