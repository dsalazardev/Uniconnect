import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { EventList, EventDetail } from './features/events/components';
import { GroupList, GroupDetail } from './features/groups/components';
import { MessageList } from './features/messages/components';
import { LoginScreen, ProfileScreen } from './features/auth/components';
import { NotificationCenter } from './features/notifications/components';
import { StudentList, StudentProfile } from './features/students/components';
import { ConnectionList } from './features/connections/components';
import { CourseList } from './features/courses/components';
import { ProgramList } from './features/programs/components';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/events" replace />,
      },
      {
        path: 'login',
        element: <LoginScreen />,
      },
      {
        path: 'profile',
        element: <ProfileScreen />,
      },
      {
        path: 'events',
        element: <EventList />,
      },
      {
        path: 'events/:id',
        element: <EventDetail />,
      },
      {
        path: 'groups',
        element: <GroupList />,
      },
      {
        path: 'groups/:id',
        element: <GroupDetail />,
      },
      {
        path: 'messages',
        element: <MessageList />,
      },
      {
        path: 'notifications',
        element: <NotificationCenter />,
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
