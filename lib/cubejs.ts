import cubejs from "@cubejs-client/core";

const CUBEJS_API_URL =
    process.env.NEXT_PUBLIC_CUBEJS_API_URL || "http://localhost:4000/cubejs-api/v1";
const CUBEJS_API_TOKEN =
    process.env.NEXT_PUBLIC_CUBEJS_API_TOKEN || "";

const cubejsApi = cubejs(CUBEJS_API_TOKEN, {
    apiUrl: CUBEJS_API_URL,
});

export default cubejsApi;
