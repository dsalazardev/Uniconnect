import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppRoot } from './components/AppRoot';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/elements';
import { EventDetail } from './features/events/components';
import { GroupDetail } from './features/groups/components';
import { EventsPage } from './pages/EventsPage';
import { GroupsPage } from './pages/GroupsPage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfileScreen } from './features/auth/components';
import { StudentList, StudentProfile } from './features/students/components';
import { ConnectionList } from './features/connections/components';
import { CourseList } from './features/courses/components';
import { ProgramList } from './features/programs/components';

// Lazy-load LoginScreen so @auth0/auth0-spa-js is only loaded when
// the user navigates to /login, preventing postMessage errors on other pages.
const LazyLoginScreen = lazy(() =>
  import('./features/auth/components').then((m) => ({ default: m.LoginScreen }))
);

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" label="Cargando..." />}>
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot><Layout /></AppRoot>,
    children: [
      {
        index: true,
        element: <Navigate to="/events" replace />,
      },
      {
        path: 'login',
        element: <SuspenseWrapper><LazyLoginScreen /></SuspenseWrapper>,
      },
      {
        path: 'profile',
        element: <ProfileScreen />,
      },
      {
        path: 'events',
        element: <EventsPage />,
      },
      {
        path: 'events/:id',
        element: <EventDetail />,
      },
      {
        path: 'groups',
        element: <GroupsPage />,
      },
      {
        path: 'groups/:id',
        element: <GroupDetail />,
      },
      {
        path: 'messages',
        element: <MessagesPage />,
      },
      {
        path: 'students',
        element: <StudentList />,
      },
      {
        path: 'students/:id',
        element: <StudentProfile />,
      },
      {
        path: 'connections',
        element: <ConnectionList />,
      },
      {
        path: 'courses',
        element: <CourseList />,
      },
      {
        path: 'programs',
        element: <ProgramList />,
      },
    ],
  },
]);
