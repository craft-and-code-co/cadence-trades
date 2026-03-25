import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const { resetPassword } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    const { error } = await resetPassword(email)
    setSubmitting(false)

    if (error) {
      toast.error('We couldn\'t send a reset email. Check the address and try again.')
      return
    }

    setSent(true)
    toast.success('Check your email for a reset link.')
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-extrabold font-headline text-primary italic">Check your email</CardTitle>
            <CardDescription>
              If an account exists for <strong>{email}</strong>, we sent a password reset link.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-primary hover:underline text-sm">
              Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold font-headline text-primary italic">Reset password</CardTitle>
          <CardDescription>Enter your email and we'll send a reset link</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="josh@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
            </Button>
            <Link to="/login" className="text-sm text-on-surface-variant hover:underline">
              Back to sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
