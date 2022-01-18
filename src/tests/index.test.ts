import swagger from "../swaggerDef.json";
import { getEndpoints, constructData } from "../utils";
import fetch from "node-fetch";
const baseUrl = "http://localhost:3313";

describe("check all returns of get endpoints", () => {
  it("should return 200 for every get call", async () => {
    const paths = swagger.paths;
    const getEndpointsValues = getEndpoints(paths, "test").get;
    await Promise.all(
      getEndpointsValues.map(async (a) => {
        const endpoint = baseUrl + a.key;
        const res = await fetch(endpoint, {
          method: "GET",
        });
        console.log(res.url);
        expect(res.status).toBe(200);
        const data = constructData(res);
        expect(data).toBeTruthy();
        expect(data).not.toBe({});
      })
    );
  });
});
