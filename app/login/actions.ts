'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) redirect('/login?message=Could not authenticate user: ' + error.message)
    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }
    const { error } = await supabase.auth.signUp(data)
    if (error) redirect('/login?message=Could not create user: ' + error.message)
    revalidatePath('/', 'layout')
    redirect('/')
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
