import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../hooks/use-auth';
import { parseApiError } from '../lib/api-client';
import { updatePassword } from '../services/auth-service';
import { updateProfile } from '../services/user-service';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    photoUrl: '',
    about: '',
    skills: '',
  });
  const [passwordForm, setPasswordForm] = useState({ password: '' });
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    setForm({
      firstName: user?.firstName || user?.firstname || '',
      lastName: user?.lastName || user?.lastname || '',
      age: user?.age ?? '',
      gender: user?.gender || '',
      photoUrl: user?.photoUrl || '',
      about: user?.about || '',
      skills: Array.isArray(user?.skills) ? user.skills.join(', ') : '',
    });
  }, [user]);

  const onSaveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await updateProfile({
        firstname: form.firstName,
        lastname: form.lastName,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender,
        photoUrl: form.photoUrl,
        about: form.about,
        skills: form.skills
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });

      setMessage('Profile updated successfully.');
      await refreshUser();
    } catch (requestError) {
      setError(parseApiError(requestError));
    } finally {
      setLoading(false);
    }
  };

  const onChangePassword = async (event) => {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');

    try {
      await updatePassword(passwordForm);
      setPasswordMessage('Password changed successfully.');
      setPasswordForm({ password: '' });
    } catch (requestError) {
      setPasswordMessage(parseApiError(requestError));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-600">
          Keep your profile updated for better matches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit profile</CardTitle>
          <CardDescription>
            Public details shown to other developers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onSaveProfile}>
            <Input
              placeholder="First name"
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
            />
            <Input
              placeholder="Last name"
              value={form.lastName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, lastName: event.target.value }))
              }
            />
            <Input
              type="number"
              placeholder="Age"
              value={form.age}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, age: event.target.value }))
              }
            />
            <Input
              placeholder="Gender (Male/Female/Other)"
              value={form.gender}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gender: event.target.value }))
              }
            />
            <Input
              className="md:col-span-2"
              placeholder="Photo URL"
              value={form.photoUrl}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, photoUrl: event.target.value }))
              }
            />
            <Textarea
              className="md:col-span-2"
              placeholder="About"
              value={form.about}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, about: event.target.value }))
              }
            />
            <Input
              className="md:col-span-2"
              placeholder="Skills (comma separated)"
              value={form.skills}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, skills: event.target.value }))
              }
            />

            {error ? (
              <p className="text-sm text-red-500 md:col-span-2">{error}</p>
            ) : null}
            {message ? (
              <p className="text-sm text-emerald-600 md:col-span-2">
                {message}
              </p>
            ) : null}

            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                {form.skills
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .slice(0, 4)
                  .map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline">
                      <KeyRound className="h-4 w-4" />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update password</DialogTitle>
                      <DialogDescription>
                        Use a strong password with letters, numbers, symbols.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-3" onSubmit={onChangePassword}>
                      <Input
                        type="password"
                        required
                        placeholder="New password"
                        value={passwordForm.password}
                        onChange={(event) =>
                          setPasswordForm({ password: event.target.value })
                        }
                      />
                      {passwordMessage ? (
                        <p className="text-sm text-slate-600">
                          {passwordMessage}
                        </p>
                      ) : null}
                      <Button type="submit" disabled={passwordLoading}>
                        {passwordLoading ? 'Updating...' : 'Update'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
