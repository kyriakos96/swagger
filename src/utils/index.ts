import _ from "lodash";
import {
  Path,
  EndpointMethod,
  EndpointMethodValues,
  Swagger,
  Parameter,
  ResponseValue,
  SchemaValue,
} from "../types/swagger";

const setEndpoint = (key: string, mode?: string) => {
  if (mode === "test") {
    return key.replace(/\{/g, "").replace(/\}/g, "");
  } else {
    return key.replace(/\{/g, ":").replace(/\}/g, "");
  }
};

const constructData = async (res) =>
  await res
    .clone()
    .json()
    .catch(() => res.text());

const getEndpoints = (paths: Path, mode?: string) => {
  let g: { key: string; value: EndpointMethodValues }[] = [];
  let d: { key: string; value: EndpointMethodValues }[] = [];
  let po: { key: string; value: EndpointMethodValues }[] = [];
  let pu: { key: string; value: EndpointMethodValues }[] = [];
  _.mapKeys(paths, (value: EndpointMethod, key: string) => {
    _.pickBy(value, (v: EndpointMethodValues, k: string) => {
      if (k === "get") g.push({ key: setEndpoint(key, mode), value: v });
      if (k === "post") po.push({ key: setEndpoint(key, mode), value: v });
      if (k === "put") pu.push({ key: setEndpoint(key, mode), value: v });
      if (k === "delete") d.push({ key: setEndpoint(key, mode), value: v });
    });
  });
  return {
    get: g,
    delete: d,
    post: po,
    put: pu,
  };
};

const extractRequiredParams = (
  path: EndpointMethodValues,
  swagger: Swagger
) => {
  const definition = extractDefinitionRequest(path, swagger);
  return definition && definition.required;
};

const extractAvailableParams = (
  path: EndpointMethodValues,
  swagger: Swagger
) => {
  const definition = extractDefinitionRequest(path, swagger);
  return definition && definition.properties;
};

const extractAvailableQueryParams = (path: EndpointMethodValues) => {
  return (path.parameters || []).filter((qp) => qp.in === "query");
};

const checkStringConcatenatedValue = (
  queryParamType: string,
  stringToBeConcatenated: string
) => {
  switch (queryParamType) {
    case "boolean":
      return (
        stringToBeConcatenated === "true" || stringToBeConcatenated === "false"
      );
    case "number": {
      return !isNaN(Number(stringToBeConcatenated));
    }
    case "integer": {
      return !isNaN(Number(stringToBeConcatenated));
    }
    default:
      return typeof stringToBeConcatenated === queryParamType;
  }
};

const validateQueryParams = (
  queryParams: object,
  availableParams: Parameter[]
) => {
  const hasExtraParams = !Object.keys(queryParams).every((qp) =>
    availableParams
      .map((e) => e.name)
      .filter((a) => a === qp || a === `${qp}[]`)
  );
  const hasInvalidType = !Object.keys(queryParams).every((qp) => {
    const e = availableParams.find((e) => e.name === qp);
    if (e?.schema?.type?.toLowerCase() === "array") {
      if (Array.isArray(queryParams[qp])) {
        return queryParams[qp].every((a) => {
          return (
            e?.schema?.items?.type &&
            checkStringConcatenatedValue(e.schema.items.type, a)
          );
        });
      } else {
        return (
          e?.schema?.items?.type &&
          checkStringConcatenatedValue(e?.schema?.items?.type, queryParams[qp])
        );
      }
    } else {
      return (
        e?.schema?.type &&
        checkStringConcatenatedValue(e?.schema?.type, queryParams[qp])
      );
    }
  });

  if (hasExtraParams) {
    return "Validation Error. Query parameter is not permitted";
  } else if (hasInvalidType) {
    return "Validation Error. Query parameter type is not valid";
  } else {
    return undefined;
  }
};

const validatePayloadWithRequiredParams = (
  payload: object,
  requiredParams: string[]
) => {
  const error = requiredParams.map((a) =>
    Object.keys(payload).includes(a) ? undefined : a
  );
  return error.filter(Boolean);
};

const validatePayloadWithNoExtraParams = (
  payload: object,
  availableParams: object
) => {
  const error = Object.keys(payload).map((a) =>
    Object.keys(availableParams).includes(a) ? undefined : a
  );
  return error.filter(Boolean);
};

const extractDefinitionRequest = (
  path: EndpointMethodValues,
  swagger: Swagger
) => {
  const definitions =
    path?.requestBody?.content["application/json"].schema["$ref"];

  const PREFIX = "#/components/schemas/";
  const payload =
    definitions &&
    definitions.substr(definitions.lastIndexOf(PREFIX) + PREFIX.length);
  return payload && swagger.components.schemas[payload];
};

const extractDefinition = (path: EndpointMethodValues, swagger: Swagger) => {
  const definitions = (((
    (path?.responses || {})["200"] as unknown as ResponseValue
  )?.content || {})["application/json"]?.schema || {})["$ref"];

  const PREFIX = "#/components/schemas/";
  const payload = definitions?.substr(
    definitions.lastIndexOf(PREFIX) + PREFIX.length
  );
  return payload && swagger.components.schemas[payload];
};

const assemblePayload = (payload: SchemaValue) => {
  return payload.example;
};

const filterArrayOrFile = (value: any, filtering: any) => {
  if (Array.isArray(value)) {
    return value.map((a) => `${a}`).includes(`${filtering}`);
  } else {
    return String(filtering) === String(value);
  }
};

const filterSwaggerPayload = (payload: any, query: any) => {
  const { label, value } = query;
  if (payload.items) {
    switch (label) {
      case "rank": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.rank)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "vessel": {
        const items = payload.items.vessels.filter((p) =>
          filterArrayOrFile(value, p.vesselId)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "rankGroup": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.rankGroup)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "nationality": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.nationality)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "firstName": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.firstName)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
        items;
      }
      case "familyName": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.familyName)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "seamanCode": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.seafarerId)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "status": {
        const items = payload.items.filter((p) =>
          filterArrayOrFile(value, p.status)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "duration": {
        if (!_.isEmpty(value)) {
          const items = payload.items.filter(
            (p) =>
              p.executionTs >= value.fromDate && p.executionTs <= value.toDate
          );
          return {
            ...payload,
            items,
            total: items.length,
          };
        } else {
          return payload;
        }
      }
      default:
        return payload;
    }
  } else {
    switch (label) {
      case "rank": {
        return {
          ...payload,
          vessels: payload.vessels
            .flatMap((a) => ({
              ...a,
              positions: a.positions.filter((p) =>
                filterArrayOrFile(value, p.positionCode)
              ),
            }))
            .filter((b) => b.positions.length > 0),
          seaServices: payload.seaServices.filter((p) =>
            filterArrayOrFile(value, p.positionCode)
          ),
        };
      }
      case "vessel": {
        const items = payload.vessels.filter((p) =>
          filterArrayOrFile(value, p.vesselId)
        );
        return {
          ...payload,
          items,
          total: items.length,
        };
      }
      case "rankGroup": {
        return {
          ...payload,
          vessels: payload.vessels
            .flatMap((a) => ({
              ...a,
              positions: a.positions.filter((p) =>
                filterArrayOrFile(value, p.rankGroup)
              ),
            }))
            .filter((b) => b.positions.length > 0),
          seaServices: payload.seaServices.filter((p) =>
            filterArrayOrFile(value, p.rankGroup)
          ),
        };
      }
      case "nationality": {
        return payload.filter((p) => filterArrayOrFile(value, p.nationality));
      }
      case "firstName": {
        return payload.filter((p) => filterArrayOrFile(value, p.firstName));
      }
      case "familyName": {
        return payload.filter((p) => filterArrayOrFile(value, p.familyName));
      }
      case "seamanCode": {
        return payload.filter((p) => filterArrayOrFile(value, p.seafarerId));
      }
      case "status": {
        return payload.items.filter((p) => filterArrayOrFile(value, p.status));
      }
      case "duration": {
        if (!_.isEmpty(value)) {
          return payload.filter(
            (p) =>
              p.executionTs >= value.fromDate && p.executionTs <= value.toDate
          );
        } else {
          return payload;
        }
      }
      default:
        return payload;
    }
  }
};

const filterPayload = (payload: any, query: any) => {
  const { label, value } = query;
  if (payload.data) {
    switch (label) {
      case "rank": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.rank)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "vessel": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.vessel)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "rankGroup": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.rankGroup)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "nationality": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.nationality)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "firstName": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.firstName)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "familyName": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.familyName)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "seamanCode": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.seafarerId)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "status": {
        const data = payload.data.filter((p) =>
          filterArrayOrFile(value, p.status)
        );
        return {
          ...payload,
          data,
          total: data.length,
        };
      }
      case "duration": {
        if (!_.isEmpty(value)) {
          const data = payload.data.filter(
            (p) =>
              p.executionTs >= value.fromDate && p.executionTs <= value.toDate
          );
          return {
            ...payload,
            data,
            total: data.length,
          };
        } else {
          return payload;
        }
      }
      default:
        return payload;
    }
  } else {
    switch (label) {
      case "rank": {
        return {
          ...payload,
          vessels: payload.vessels
            .flatMap((a) => ({
              ...a,
              positions: a.positions.filter((p) =>
                filterArrayOrFile(value, p.positionCode)
              ),
            }))
            .filter((b) => b.positions.length > 0),
          seaServices: payload.seaServices.filter((p) =>
            filterArrayOrFile(value, p.positionCode)
          ),
        };
      }
      case "vessel": {
        return {
          ...payload,
          vessels: payload.vessels.filter((p) =>
            filterArrayOrFile(value, p.code)
          ),
        };
      }
      case "rankGroup": {
        return {
          ...payload,
          vessels: payload.vessels
            .flatMap((a) => ({
              ...a,
              positions: a.positions.filter((p) =>
                filterArrayOrFile(value, p.rankGroup)
              ),
            }))
            .filter((b) => b.positions.length > 0),
          seaServices: payload.seaServices.filter((p) =>
            filterArrayOrFile(value, p.rankGroup)
          ),
        };
      }
      case "nationality": {
        return payload.filter((p) => filterArrayOrFile(value, p.nationality));
      }
      case "firstName": {
        return payload.filter((p) => filterArrayOrFile(value, p.firstName));
      }
      case "familyName": {
        return payload.filter((p) => filterArrayOrFile(value, p.familyName));
      }
      case "seamanCode": {
        return payload.filter((p) => filterArrayOrFile(value, p.seafarerId));
      }
      case "status": {
        return payload.data.filter((p) => filterArrayOrFile(value, p.status));
      }
      case "duration": {
        if (!_.isEmpty(value)) {
          return payload.filter(
            (p) =>
              p.executionTs >= value.fromDate && p.executionTs <= value.toDate
          );
        } else {
          return payload;
        }
      }
      default:
        return payload;
    }
  }
};

const paginatePayload = (
  payload: { data: object[] },
  from: number,
  size: number
) => {
  return {
    ...payload,
    data: payload.data.slice(from, Number(from) + Number(size)),
  };
};

const paginateSwaggerPayload = (
  payload: { data: { items: object[] } },
  from: number,
  size: number
) => {
  return {
    ...payload,
    data: {
      ...payload.data,
      items: payload.data.items.slice(from, Number(from) + Number(size)),
    },
  };
};

export {
  constructData,
  getEndpoints,
  setEndpoint,
  extractDefinition,
  assemblePayload,
  extractAvailableParams,
  extractRequiredParams,
  validatePayloadWithNoExtraParams,
  validatePayloadWithRequiredParams,
  validateQueryParams,
  filterPayload,
  filterSwaggerPayload as filterSwaggerPayload,
  paginatePayload,
  paginateSwaggerPayload as paginateSwaggerPayload,
  extractAvailableQueryParams,
};
