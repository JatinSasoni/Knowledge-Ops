import { createBrowserRouter } from "react-router";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./pages/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DocumentsTab } from "./pages/workspace/DocumentsTab";
import { MembersTab } from "./pages/workspace/MembersTab";
import { SettingsTab } from "./pages/workspace/SettingsTab";
import { WorkspaceLayout } from "./pages/workspace/WorkspaceLayout";
import { WorkspacesPage } from "./pages/WorkspacesPage";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/workspaces", element: <WorkspacesPage /> },
          {
            path: "/workspaces/:workspaceId",
            element: <WorkspaceLayout />,
            children: [
              { index: true, element: <DocumentsTab /> },
              { path: "members", element: <MembersTab /> },
              { path: "settings", element: <SettingsTab /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
