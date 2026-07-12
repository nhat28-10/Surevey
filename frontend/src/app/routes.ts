import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { CustomerDashboard } from "./components/CustomerDashboard";
import { PostSurvey } from "./components/PostSurvey";
import { SurveyBuilder } from "./components/SurveyBuilder";
import { CollaboratorMarketplace } from "./components/CollaboratorMarketplace";
import { FAQ } from "./components/FAQ";
import { TicketStatus } from "./components/TicketStatus";
import { Login } from "./components/Login";
import { Signup } from "./components/Signup";
import { NotFound } from "./components/NotFound";
import { SurveyDoing } from "./components/SurveyDoing";
import { CollaboratorFinishedSurveys } from "./components/CollaboratorFinishedSurveys";
import { AdminProcessRequests } from "./components/AdminProcessRequests";
import { UserProfile } from "./components/UserProfile";
import { SurveyDetail } from "./components/SurveyDetail";

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
        path: "customer/dashboard",
        Component: CustomerDashboard,
      },
      {
        path: "customer/post",
        Component: PostSurvey,
      },
      {
        path: "customer/survey-builder",
        Component: SurveyBuilder,
      },
      {
        path: "collaborator/marketplace",
        Component: CollaboratorMarketplace,
      },
      {
        path: "collaborator/survey/:surveyId",
        Component: SurveyDoing,
      },
      {
        path: "owner/survey/:surveyId",
        Component: SurveyDetail,
      },
      {
        path: "owner/survey/:surveyId",
        Component: SurveyDetail,
      },
      {
        path: "collaborator/finished",
        Component: CollaboratorFinishedSurveys,
      },
      {
        path: "admin/requests",
        Component: AdminProcessRequests,
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
        path: "profile",
        Component: UserProfile,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);
