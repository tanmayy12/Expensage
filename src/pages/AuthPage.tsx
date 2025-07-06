import { useCallback, useState, useEffect } from 'react';
import AuthModal from '@/components/AuthModal';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  // Check for JWT and redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => navigate('/'), 200); // slight delay for modal close animation
  }, [navigate]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1a1333] via-[#1a183a] to-[#1a1a2e] flex items-center justify-center">
      <AuthModal
        isOpen={open}
        onClose={handleClose}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export default AuthPage; 