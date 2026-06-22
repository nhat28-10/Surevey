import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { OwnerDashboard } from "./components/OwnerDashboard";
import { PostSurvey } from "./components/PostSurvey";
import { SurveyBuilder } from "./components/SurveyBuilder";
import { HelperMarketplace } from "./components/HelperMarketplace";
import { FAQ } from "./components/FAQ";
import { TicketStatus } from "./components/TicketStatus";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { NotFound } from "./components/NotFound";
import { SurveyDoing } from "./components/SurveyDoing";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: "login",
        Component: Login,
      },
      {
        path: "signup",
        Component: Signup,
      },
      {
        path: "owner/dashboard",
        Component: OwnerDashboard,
      },
      {
        path: "owner/post",
        Component: PostSurvey,
      },
      {
        path: "owner/survey-builder",
        Component: SurveyBuilder,
      },
      {
        path: "helper/marketplace",
        Component: HelperMarketplace,
      },
      {
        path: "helper/survey/:surveyId",
        Component: SurveyDoing,
      },
      {
        path: "support/faq",
        Component: FAQ,
      },
      {
        path: "support/tickets",
        Component: TicketStatus,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
