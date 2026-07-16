import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { PostSurvey } from "./components/PostSurvey";
import { HelperMarketplace } from "./components/HelperMarketplace";
import { FAQ } from "./components/FAQ";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { NotFound } from "./components/NotFound";
import { SurveyDoing } from "./components/SurveyDoing";
import { HelperFinishedSurveys } from "./components/HelperFinishedSurveys";
import { AdminProcessRequests } from "./components/AdminProcessRequests";
import { SurveyDetail } from "./components/SurveyDetail";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Profile } from "./components/Profile";

export const router = createBrowserRouter([{
  path: "/",
  Component: Layout,
  children: [
    { index: true, Component: Home },
    { path: "login", Component: Login },
    { path: "signup", Component: Signup },
    { path: "customer/dashboard", element: <ProtectedRoute roles={["Customer"]}><OwnerDashboard /></ProtectedRoute> },
    { path: "customer/post", element: <ProtectedRoute roles={["Customer"]}><PostSurvey /></ProtectedRoute> },
    { path: "customer/campaign/:surveyId", element: <ProtectedRoute roles={["Customer"]}><SurveyDetail /></ProtectedRoute> },
    { path: "collaborator/marketplace", element: <ProtectedRoute roles={["Collaborator"]}><HelperMarketplace /></ProtectedRoute> },
    { path: "collaborator/participation/:surveyId", element: <ProtectedRoute roles={["Collaborator"]}><SurveyDoing /></ProtectedRoute> },
    { path: "collaborator/activities", element: <ProtectedRoute roles={["Collaborator"]}><HelperFinishedSurveys /></ProtectedRoute> },
    { path: "admin", element: <ProtectedRoute roles={["Admin"]}><AdminProcessRequests /></ProtectedRoute> },
    { path: "profile", element: <ProtectedRoute><Profile /></ProtectedRoute> },
    { path: "support/faq", Component: FAQ },

    { path: "owner/dashboard", element: <Navigate to="/customer/dashboard" replace /> },
    { path: "owner/post", element: <Navigate to="/customer/post" replace /> },
    { path: "owner/survey/:surveyId", element: <Navigate to="/customer/dashboard" replace /> },
    { path: "helper/marketplace", element: <Navigate to="/collaborator/marketplace" replace /> },
    { path: "helper/finished", element: <Navigate to="/collaborator/activities" replace /> },
    { path: "admin/requests", element: <Navigate to="/admin" replace /> },
    { path: "customer/survey-builder", element: <Navigate to="/customer/post" replace /> },
    { path: "support/tickets", element: <Navigate to="/support/faq" replace /> },
    { path: "*", Component: NotFound },
  ],
}]);
