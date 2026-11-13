import { Link, type RouteObject } from "react-router";
import App, { Home, Archive, Issue, SubscribePage, Unsubscribe, Admin } from "./App";

// Every page of the app is listed here, and only here. main.tsx builds the router from this
// array and exposes it as window.__baze.routes so the BAZE preview can list the pages.
// App (src/App.tsx) is the shell around every page; it renders the current page in <Outlet />.
export const routes: RouteObject[] = [
  {
    element: <App />,
    children: [
      { index: true, element: <Home/> },
      { path: "archive", element: <Archive/> },
      { path: "issues/:slug", element: <Issue/> },
      { path: "subscribe", element: <SubscribePage/> },
      { path: "unsubscribe", element: <Unsubscribe/> },
      { path: "admin", element: <Admin/>, handle: { owner: true } },
      {
        path: "*",
        element: <div className="frame"><div className="cell empty-cell"><h1 className="page-title">페이지를 찾을 수 없어요.</h1><Link className="pill pill-line" to="/">처음으로</Link></div></div>,
      },
    ],
  },
];
