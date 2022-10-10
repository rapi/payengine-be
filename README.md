# payengine-be

## Start containers
### `docker-compose up`

## Start dev env
### `npm run dev`

## Open endpoints
- POST `/api/login` input:
  - password
  - email

- POST `/api/signup` input:
  - first_name
  - last_name
  - password
  - email

## Protected endpoints by header `Authorization`

- POST `/api/transaction` input:
  - amount
  - currency

- POST `/api/info` input:
  - amount
  - currency
  
