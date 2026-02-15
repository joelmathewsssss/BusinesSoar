"use client"

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const LoginForm = dynamic(() => import('./login-form'), {
  ssr: false,
})

export default function LoginPage() {
  return (
    <main className="p-8">
      <Suspense fallback={<p>Loading...</p>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
