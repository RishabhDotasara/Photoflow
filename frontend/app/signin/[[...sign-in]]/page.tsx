import { SignIn } from '@clerk/nextjs'

export default function Page() {
    return (
        <div className='bg-gray-100 h-screen flex items-center justify-center'>
            <SignIn fallbackRedirectUrl={"/home"}/>
        </div>
    )
}