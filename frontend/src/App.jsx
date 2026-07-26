import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // Import this
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Users from './pages/Users';
import ProfileView from './pages/ProfileView';
import ProfileSetup from './components/ProfileSetup';
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <>
      <Toaster 
  position="bottom-right" 
  toastOptions={{
    // This sets the default duration for all toasts
    duration: 3000, 
    style: {
      background: '#0f172a', // Slate-950
      color: '#f1f5f9',      // Slate-100
      border: '1px solid #1e293b', // Slate-800
      borderRadius: '12px',
      fontSize: '14px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
    },
    success: {
      duration: 2000, // You can override it per type if needed
      iconTheme: {
        primary: '#10b981', // Emerald-500
        secondary: '#fff',
      },
    },
    error: {
      duration: 2000, // You can override it per type if needed
      iconTheme: {
        primary: '#f43f5e', // Rose-500
        secondary: '#fff',
      },
    },
  }} 
/>

      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route
  path="/groups/:id"
  element={<GroupDetails />}
/>
        <Route path="/groups" element={<Groups />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="profile" element={<ProfileView />} />
        <Route path="/profile/edit" element={<ProfileSetup />} />
        <Route path="tasks/:id" element={<TaskDetails />} />
        <Route
          path="users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />
      </Route>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="profile" element={<ProfileView />} />
          <Route path="/profile/edit" element={<ProfileSetup />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route
            path="users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;