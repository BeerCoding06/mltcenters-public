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
const VocabLayout = lazy(() => import("./pages/vocab/VocabLayout"));
const VocabDashboardPage = lazy(() => import("./pages/vocab/VocabDashboardPage"));
const VocabOnboardingPage = lazy(() => import("./pages/vocab/VocabOnboardingPage"));
const VocabLearnPage = lazy(() => import("./pages/vocab/VocabLearnPage"));
const VocabWordDetailPage = lazy(() => import("./pages/vocab/VocabWordDetailPage"));
const VocabReviewPage = lazy(() => import("./pages/vocab/VocabReviewPage"));
const VocabQuizPage = lazy(() => import("./pages/vocab/VocabQuizPage"));
const VocabSentencesPage = lazy(() => import("./pages/vocab/VocabSentencesPage"));
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
              <Route path="/vocab" element={<VocabLayout />}>
                <Route index element={<VocabDashboardPage />} />
                <Route path="onboarding" element={<VocabOnboardingPage />} />
                <Route path="learn" element={<VocabLearnPage />} />
                <Route path="learn/:wordId" element={<VocabWordDetailPage />} />
                <Route path="review" element={<VocabReviewPage />} />
                <Route path="quiz" element={<VocabQuizPage />} />
                <Route path="sentences" element={<VocabSentencesPage />} />
              </Route>
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
