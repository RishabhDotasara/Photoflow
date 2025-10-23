import { SignUp } from '@clerk/nextjs'
import React from 'react'

export default function Signup() {
  return (
    <div className='h-screen w-full bg-gray-100 flex items-center justify-center'>
      <SignUp forceRedirectUrl={"/onboard-user"}/>
    </div>
  )
}
