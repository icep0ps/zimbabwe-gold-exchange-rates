import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("history", "routes/history.tsx"),
  route("docs", "routes/docs.tsx"),
  route("rates/:date", "routes/rates.$date.tsx"),
  route("sitemap.xml", "routes/sitemap.xml.tsx"),
] satisfies RouteConfig;
