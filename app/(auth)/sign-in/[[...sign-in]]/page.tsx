import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            socialButtonsBlockButton: 'border border-input bg-background hover:bg-accent',
            socialButtonsBlockButtonText: 'font-normal',
          },
        }}
      />
    </div>
  )
}

