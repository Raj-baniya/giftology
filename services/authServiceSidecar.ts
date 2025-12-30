
import { supabase } from './supabaseClient';
import { User } from '../types';

export interface AuthResult {
    user: User | null;
    error: string | null;
    isNewUser?: boolean;
}

/**
 * Service Sidecar for Authentication
 * 
 * This service isolates the critical path for OTP login and Registration.
 * It is designed to be "Defensive" and "Self-Healing".
 */
export const AuthSidecar = {

    /**
     * Robustly gets or creates a user profile.
     * Use this after ANY successful auth to ensure the profile table is in sync.
     */
    ensureUserProfile: async (authUserId: string, email: string, name?: string): Promise<boolean> => {
        try {
            console.log(`[AuthSidecar] Ensuring profile for ${authUserId}`);

            // 1. Check if profile exists
            const { data: profile, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', authUserId)
                .maybeSingle();

            if (fetchError) {
                console.error('[AuthSidecar] Profile check failed:', fetchError);
                // Don't throw, try to insert anyway if we suspect it's missing
            }

            if (profile) {
                console.log('[AuthSidecar] Profile exists.');
                return true;
            }

            // 2. Profile missing, attempt manual creation (Self-Healing)
            console.warn('[AuthSidecar] Profile missing. Attempting self-healing...');

            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    id: authUserId,
                    email: email,
                    full_name: name || email.split('@')[0],
                    reward_points: 500, // Default for new users
                    role: 'user'
                }]);

            if (insertError) {
                console.error('[AuthSidecar] Self-healing failed:', insertError);
                // If this fails, it might be RLS or a Trigger racing. 
                // We can't do much more than log it.
                return false;
            }

            console.log('[AuthSidecar] Self-healing successful.');
            return true;
        } catch (err) {
            console.error('[AuthSidecar] Unexpected error in ensureUserProfile:', err);
            return false;
        }
    },

    /**
     * Specialized Login Flow for OTP that handles the "Database error" scenario.
     */
    verifyOtpAndSync: async (email: string, token: string): Promise<AuthResult> => {
        try {
            // Normalizing email: lowercase, trim, and auto-append @gmail.com if missing
            let normalizedEmail = email.trim().toLowerCase();
            if (!normalizedEmail.includes('@') && normalizedEmail.length > 0) {
                normalizedEmail += '@gmail.com';
            }

            console.log(`[AuthSidecar] Verifying OTP for ${normalizedEmail}`);

            // 1. Verify OTP
            const storedOtp = sessionStorage.getItem(`giftology_otp_${normalizedEmail}`);
            if (!storedOtp || storedOtp !== token) {
                return { user: null, error: 'Invalid or expired OTP' };
            }

            // 2. Clear OTP
            sessionStorage.removeItem(`giftology_otp_${normalizedEmail}`);

            // 3. Authenticate with Supabase
            const deterministicPassword = `Giftology@${normalizedEmail}`;
            let authUser = null;
            let isNew = false;

            // A. Try Sign In
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: deterministicPassword
            });

            if (signInData.session) {
                authUser = signInData.session.user;
            } else {
                // B. Try Sign Up (If Sign In failed)
                console.log('[AuthSidecar] Sign in failed, trying registration...');

                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password: deterministicPassword,
                    options: { data: { full_name: normalizedEmail.split('@')[0] } }
                });


                if (signUpData.session) {
                    authUser = signUpData.session.user;
                    isNew = true;
                } else if (signUpError) {
                    // Check for "User already registered" which means password mismatch
                    if (signUpError.message?.includes('already registered')) {
                        return { user: null, error: 'Account exists. Please login with password.' };
                    }
                    console.error('[AuthSidecar] Registration failed:', signUpError);
                    return { user: null, error: `Registration failed: ${signUpError.message}` };
                }
            }

            if (!authUser) {
                return { user: null, error: 'Authentication failed.' };
            }

            // 4. CRITICAL: Ensure Profile Exists
            if (authUser) {
                const profileSynced = await AuthSidecar.ensureUserProfile(
                    authUser.id,
                    authUser.email!,
                    authUser.user_metadata?.full_name
                );

                if (!profileSynced && isNew) {
                    console.warn('[AuthSidecar] Profile sync failed, but Auth User created. Degrading gracefully.');
                }
            } else {
                return { user: null, error: 'Authentication fatally failed.' };
            }


            // 5. Construct App User Object
            const appUser: User = {
                id: authUser.id,
                email: authUser.email!,
                displayName: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
                joinDate: authUser.created_at,
                role: 'user'
            };

            return { user: appUser, error: null, isNewUser: isNew };

        } catch (err: any) {
            console.error('[AuthSidecar] Critical Error:', err);
            return { user: null, error: 'System error. Please try again.' };
        }
    }
};
