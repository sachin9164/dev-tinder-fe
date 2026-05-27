import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/use-auth';

export function AuthPage() {
  //ds
  const { isAuthenticated, login, signUp } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/discover" replace />;
  }

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (isLoginMode) {
      const result = await login({
        email: form.email,
        password: form.password,
      });
      if (!result.ok) {
        setError(result.message);
      }
    } else {
      const result = await signUp(form);
      if (result.ok) {
        setMessage('Signup successful. You can login now.');
        setIsLoginMode(true);
      } else {
        setError(result.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="app-bg flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isLoginMode ? 'Welcome back' : 'Create your profile'}
          </CardTitle>
          <CardDescription>
            {isLoginMode
              ? 'Login to continue swiping developers.'
              : 'Join Dev Tinder and start connecting.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onSubmit}>
            {!isLoginMode ? (
              <>
                <Input
                  required
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                />
              </>
            ) : null}

            <Input
              required
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
            />
            <Input
              required
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
            />

            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {message ? (
              <p className="text-sm text-emerald-600">{message}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : isLoginMode ? 'Login' : 'Sign up'}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 text-sm font-medium text-rose-600"
            onClick={() => {
              setIsLoginMode((prev) => !prev);
              setError('');
              setMessage('');
            }}
          >
            {isLoginMode
              ? 'Need an account? Sign up'
              : 'Already have an account? Login'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
