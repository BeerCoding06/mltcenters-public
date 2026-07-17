import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import { AnalyticsProvider } from "@/analytics/AnalyticsProvider";
import Navbar from "@/components/Navbar";
import { SiteSEO } from "@/components/PageSEO";
import { PageLoader } from "@/components/PageLoader";
import { DeferredSonner } from "@/DeferredSonner";

const FooterSection = lazy(() => import("@/components/FooterSection"));

const Index = lazy(() => import("./pages/Index"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ActivitiesPage = lazy(() => import("./pages/ActivitiesPage"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const EnglishAssessmentPage = lazy(() => import("./pages/EnglishAssessmentPage"));
const AssessmentDashboard = lazy(() => import("./pages/AssessmentDashboard"));
const RunnerRedirectPage = lazy(() => import("./pages/RunnerRedirectPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <I18nProvider>
    <DeferredSonner />
    <BrowserRouter>
      <AnalyticsProvider>
        <SiteSEO />
        <Navbar />
        <main id="main-content" className="min-h-screen">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/assessment" element={<EnglishAssessmentPage />} />
              <Route path="/assessment/dashboard" element={<AssessmentDashboard />} />
              <Route path="/runner-app/*" element={<RunnerRedirectPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <FooterSection />
        </Suspense>
      </AnalyticsProvider>
    </BrowserRouter>
  </I18nProvider>
);

export default App;
