import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ userId, children }: { userId: string | null, children: JSX.Element }) => {
  return userId ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
