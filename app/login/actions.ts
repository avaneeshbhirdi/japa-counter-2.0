'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    if (!email || !password) return { error: 'Email and password are required' }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const city = formData.get('city') as string
    
    if (!email || !password) return { error: 'Email and password are required' }

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
                city: city,
            }
        }
    })
    
    if (error) return { error: error.message }
    
    return { success: true }
}

export async function verifyOtp(email: string, token: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
    })
    
    if (error) return { error: error.message }
    
    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signInWithGoogle() {
    const supabase = await createClient();

    let origin = process?.env?.NEXT_PUBLIC_SITE_URL ?? process?.env?.VERCEL_URL ?? 'http://localhost:3000';
    origin = origin.startsWith('http') ? origin : `https://${origin}`;
    origin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
        },
    });

    if (error) {
        redirect('/login?message=Could not authenticate with Google');
    }

    if (data.url) {
        redirect(data.url);
    }
}
