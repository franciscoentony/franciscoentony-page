import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          index: true, // Define a Home como a página principal do "/"
          element: <Home />,
        },
        {
          path: "blog", // Caminho relativo, vira "/blog"
          element: <Blog />,
        },
        {
          path: "blog/:slug", // Caminho relativo, vira "/blog/:slug"
          element: <BlogPost />,
        },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);