import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { BriefcaseBusiness, Loader2, Eye, EyeOff } from 'lucide-react';
import { LoginSchema, type LoginInput } from '@cv-generator/shared';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      await login(data);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-[400px] border border-border bg-card animate-scale-in">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2.5">
              <BriefcaseBusiness className="w-6 h-6 text-primary" />
              <span className="font-bold tracking-tight text-xl text-primary font-sans">GISCON</span>
            </div>
          </div>
          <h1 id="login-title" className="text-2xl font-semibold leading-none tracking-tight text-foreground">
            Welcome back
          </h1>
          <CardDescription className="text-muted-foreground mt-1.5">
            Sign in to GISCON CV Generator
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 pb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@giscon.com"
                autoComplete="email"
                {...register('email')}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="bg-background border-input focus-visible:ring-ring"
              />
              {errors.email && (
                <p id="email-error" className="text-destructive text-xs font-medium mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className="pr-10 bg-background border-input focus-visible:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:text-foreground focus-visible:ring-1 focus-visible:ring-ring rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-destructive text-xs font-medium mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div
                className="text-destructive text-xs font-medium bg-destructive/5 border border-destructive/10 px-3 py-2 rounded-md"
                role="alert"
              >
                {error}
              </div>
            )}

            <Button
              id="login-submit-button"
              type="submit"
              size="lg"
              className="w-full mt-2 font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

