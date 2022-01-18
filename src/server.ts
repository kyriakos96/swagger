import express from "express";
import swaggerUi from "swagger-ui-express";
import _ from "lodash";
import swagger from "./swaggerDef.json";
import {
  getEndpoints,
  extractAvailableQueryParams,
  assemblePayload,
  extractDefinition,
  validateQueryParams,
  filterSwaggerPayload,
  paginateSwaggerPayload,
  extractRequiredParams,
  extractAvailableParams,
  validatePayloadWithRequiredParams,
  validatePayloadWithNoExtraParams,
} from "./utils";
import cors from "cors";
import { Swagger } from "./types/swagger";
import bodyParser from "body-parser";

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(bodyParser.json());
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const swagger2: Swagger = swagger;

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger));
const endpoints = getEndpoints(swagger2.paths);
endpoints.get.map((endpoint) => {
  app.get(endpoint.key, (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    const availableParams = extractAvailableQueryParams(endpoint.value);
    const queryParams = req.query;
    const hasQueryParams = !_.isEmpty(queryParams);
    const areParamsInValid = hasQueryParams
      ? validateQueryParams(queryParams, availableParams)
      : false;

    if (areParamsInValid) {
      res.statusCode = 400;
      res.send(areParamsInValid);
    } else {
      const payload = extractDefinition(endpoint.value, swagger);
      const data = payload && assemblePayload(payload);
      if (hasQueryParams) {
        const pagination = _.pickBy(queryParams, (_, key) => {
          if (key === "from" || key === "size") {
            return key;
          }
        });
        if (!(pagination.from && pagination.size)) {
          const filteredData = Object.keys(queryParams)
            .map((qp) => ({
              label: qp,
              value: queryParams[qp],
            }))
            .reduce((acc, curr) => {
              return filterSwaggerPayload(acc.data, curr);
            }, data);
          res.json(filteredData);
        } else {
          const filteredData = Object.keys(queryParams)
            .filter((a) => a !== "from" && a !== "size")
            .map((qp) => ({
              label: qp,
              value: queryParams[qp],
            }))
            .reduce((acc, curr) => {
              return filterSwaggerPayload(acc.data, curr);
            }, data);
          res.json(
            paginateSwaggerPayload(
              filteredData,
              Number(pagination.from),
              Number(pagination.size)
            )
          );
        }
      } else {
        res.json(data);
      }
    }
  });
});
endpoints.delete.map((endpoint) => {
  app.delete(endpoint.key, (_req, res) => {
    res.statusCode = 200;
    const payload = extractDefinition(endpoint.value, swagger);
    const data = payload && assemblePayload(payload);
    res.send({ code: 200, data });
  });
});

endpoints.put.map((endpoint) => {
  app.put(endpoint.key, (req, res) => {
    const requiredParams = extractRequiredParams(endpoint.value, swagger);
    const availableParams = extractAvailableParams(endpoint.value, swagger);
    const validateRequiredParams =
      (requiredParams &&
        validatePayloadWithRequiredParams(req.body, requiredParams)) ??
      [];
    const validateNoExtraParams =
      (availableParams &&
        validatePayloadWithNoExtraParams(req.body, availableParams)) ??
      [];

    if (validateRequiredParams.length > 0) {
      res.statusCode = 404;
      res.send(
        "Validation error with required params" +
          JSON.stringify(validateRequiredParams)
      );
    } else if (validateNoExtraParams.length > 0) {
      res.statusCode = 404;
      res.send(
        "Validation error with extra params" +
          JSON.stringify(validateNoExtraParams)
      );
    } else {
      res.statusCode = 201;
      res.send("Created");
    }
  });
});

endpoints.post.map((endpoint) => {
  app.post(endpoint.key, (req, res) => {
    const requiredParams = extractRequiredParams(endpoint.value, swagger);
    const availableParams = extractAvailableParams(endpoint.value, swagger);
    const validateRequiredParams =
      (requiredParams &&
        validatePayloadWithRequiredParams(req.body, requiredParams)) ??
      [];
    const validateNoExtraParams =
      (availableParams &&
        validatePayloadWithNoExtraParams(req.body, availableParams)) ??
      [];

    if (validateRequiredParams.length > 0) {
      res.statusCode = 404;
      res.send(
        "Validation error with required params" +
          JSON.stringify(validateRequiredParams)
      );
    } else if (validateNoExtraParams.length > 0) {
      res.statusCode = 404;
      res.send(
        "Validation error with extra params" +
          JSON.stringify(validateNoExtraParams)
      );
    } else {
      const payload = extractDefinition(endpoint.value, swagger);
      const data = payload && assemblePayload(payload);
      res.statusCode = 201;
      res.send(data);
    }
  });
});

app.get("/swagger", (_req, res) => {
  res.json(swagger);
});

app
  .listen(3313, () => {
    console.log("App listening on ports => http:3313");
  })
  .on("error", (err) => {
    if (err) throw err;
  });
