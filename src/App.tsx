import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { SiteSEO } from "@/components/PageSEO";
import { PageLoader } from "@/components/PageLoader";

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
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <TooltipProvider>
    <I18nProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <FooterSection />
      </BrowserRouter>
    </I18nProvider>
  </TooltipProvider>
);

export default App;
