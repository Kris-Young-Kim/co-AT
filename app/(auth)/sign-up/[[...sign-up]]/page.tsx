import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
            socialButtonsBlockButton: 'border border-input bg-background hover:bg-accent',
            socialButtonsBlockButtonText: 'font-normal',
          },
        }}
        // Apple, Google, Kakao만 표시 (Facebook 제외)
        socialConnections={['oauth_apple', 'oauth_google', 'oauth_kakao']}
      />
    </div>
  )
}

